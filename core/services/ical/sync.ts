import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '@/core/db';
import { calendarDays, icalEvents, icalFeeds, listings } from '@/core/db/schema';
import { occupiedDatesForStay } from '@/core/services/direct-booking-policy';
import { InvalidIcalFeedError, parseIcalBusyEvents } from './parser';

type Provider = 'airbnb' | 'booking' | 'vrbo';

export interface IcalSyncResult {
  provider: Provider;
  ok: boolean;
  eventCount?: number;
  errorCode?: string;
}

export async function syncConfiguredIcalFeeds(): Promise<IcalSyncResult[]> {
  if (process.env.OFFLINE_MODE !== 'off') {
    throw new Error('iCal sync is disabled while OFFLINE_MODE is active.');
  }

  const listing = await resolveListing();
  if (!listing) throw new Error('Villa Isora listing is not configured.');

  const configs: Array<{ provider: Provider; url: string }> = [
    { provider: 'airbnb', url: process.env.AIRBNB_ICAL_URL?.trim() ?? '' },
    { provider: 'booking', url: process.env.BOOKING_ICAL_URL?.trim() ?? '' },
    { provider: 'vrbo', url: process.env.VRBO_ICAL_URL?.trim() ?? '' },
  ].filter((config) => config.url) as Array<{ provider: Provider; url: string }>;

  const results: IcalSyncResult[] = [];
  for (const config of configs) {
    results.push(await syncOneFeed(listing, config));
  }
  if (results.some((result) => result.ok)) await rebuildExternalProjection(listing);
  return results;
}

async function resolveListing() {
  const configuredId = process.env.PUBLIC_BOOKING_LISTING_ID?.trim();
  return configuredId
    ? (await db.select({ id: listings.id, workspaceId: listings.workspaceId }).from(listings).where(eq(listings.id, configuredId)).limit(1))[0]
    : (await db.select({ id: listings.id, workspaceId: listings.workspaceId }).from(listings).where(eq(listings.name, 'Villa Isora')).limit(1))[0];
}

async function syncOneFeed(
  listing: { id: string; workspaceId: string },
  config: { provider: Provider; url: string },
): Promise<IcalSyncResult> {
  const now = new Date();
  const feed = (await db.insert(icalFeeds).values({
    workspaceId: listing.workspaceId, listingId: listing.id, provider: config.provider,
    status: 'syncing', lastAttemptAt: now, updatedAt: now,
  }).onConflictDoUpdate({
    target: [icalFeeds.listingId, icalFeeds.provider],
    set: { status: 'syncing', lastAttemptAt: now, errorCode: null, updatedAt: now },
  }).returning({ id: icalFeeds.id }))[0]!;

  try {
    const response = await fetch(config.url, {
      headers: { 'User-Agent': 'Villa-Isora-Calendar-Sync/1.0', Accept: 'text/calendar' },
      cache: 'no-store', signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new FeedSyncError(`http_${response.status}`);
    const body = await response.text();
    const events = parseIcalBusyEvents(body);

    await db.transaction(async (tx) => {
      await tx.update(icalEvents).set({ status: 'missing', updatedAt: now }).where(eq(icalEvents.feedId, feed.id));
      for (const event of events) {
        const uidHash = createHash('sha256').update(event.uid).digest('hex');
        const status = event.cancelled ? 'cancelled' : 'active';
        await tx.insert(icalEvents).values({
          feedId: feed.id, workspaceId: listing.workspaceId, listingId: listing.id,
          uidHash, checkIn: event.checkIn, checkOut: event.checkOut, status,
          lastSeenAt: now, updatedAt: now,
        }).onConflictDoUpdate({
          target: [icalEvents.feedId, icalEvents.uidHash],
          set: { checkIn: event.checkIn, checkOut: event.checkOut, status, lastSeenAt: now, updatedAt: now },
        });
      }
      await tx.update(icalFeeds).set({
        status: 'healthy', lastSuccessAt: now, lastEventCount: events.length,
        errorCode: null, etag: response.headers.get('etag'),
        lastModified: response.headers.get('last-modified'), updatedAt: now,
      }).where(eq(icalFeeds.id, feed.id));
    });
    return { provider: config.provider, ok: true, eventCount: events.length };
  } catch (error) {
    const errorCode = sanitiseError(error);
    await db.update(icalFeeds).set({ status: 'error', errorCode, updatedAt: new Date() }).where(eq(icalFeeds.id, feed.id));
    return { provider: config.provider, ok: false, errorCode };
  }
}

async function rebuildExternalProjection(listing: { id: string; workspaceId: string }) {
  await db.transaction(async (tx) => {
    await tx.delete(calendarDays).where(and(eq(calendarDays.listingId, listing.id), eq(calendarDays.source, 'external')));
    const events = await tx.select({ checkIn: icalEvents.checkIn, checkOut: icalEvents.checkOut })
      .from(icalEvents).where(and(eq(icalEvents.listingId, listing.id), eq(icalEvents.status, 'active')));
    const dates = [...new Set(events.flatMap((event) => occupiedDatesForStay(event.checkIn, event.checkOut)))];
    if (dates.length) {
      await tx.insert(calendarDays).values(dates.map((date) => ({
        workspaceId: listing.workspaceId, listingId: listing.id, date,
        available: false, blockedReason: 'External calendar', source: 'external', updatedAt: new Date(),
      }))).onConflictDoNothing();
    }
  });
}

class FeedSyncError extends Error {}

function sanitiseError(error: unknown): string {
  if (error instanceof FeedSyncError) return error.message;
  if (error instanceof InvalidIcalFeedError) return 'invalid_calendar';
  if (error instanceof Error && error.name === 'TimeoutError') return 'timeout';
  return 'fetch_failed';
}
