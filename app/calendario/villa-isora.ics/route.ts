import { and, eq, gte, inArray, isNull } from 'drizzle-orm';
import { db } from '@/core/db';
import { calendarDays, listings, reservations } from '@/core/db/schema';
import { buildPublicIcal, groupBlockedDates, type PublicCalendarEvent } from '@/core/services/ical/export';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const configuredListingId = process.env.PUBLIC_BOOKING_LISTING_ID?.trim();
  const listing = configuredListingId
    ? (await db.select({ id: listings.id }).from(listings).where(eq(listings.id, configuredListingId)).limit(1))[0]
    : (await db.select({ id: listings.id }).from(listings).where(eq(listings.name, 'Villa Isora')).limit(1))[0];

  if (!listing) return new Response('Calendar unavailable.', { status: 503 });

  const today = new Date().toISOString().slice(0, 10);
  const [directReservations, manualDays] = await Promise.all([
    db.select({ id: reservations.id, checkIn: reservations.checkIn, checkOut: reservations.checkOut })
      .from(reservations)
      .where(and(
        eq(reservations.listingId, listing.id),
        eq(reservations.platform, 'direct'),
        inArray(reservations.status, ['pending', 'confirmed']),
        gte(reservations.checkOut, today),
      )),
    db.select({ date: calendarDays.date }).from(calendarDays).where(and(
      eq(calendarDays.listingId, listing.id),
      eq(calendarDays.available, false),
      eq(calendarDays.source, 'manual'),
      isNull(calendarDays.reservationId),
      gte(calendarDays.date, today),
    )),
  ]);

  const events: PublicCalendarEvent[] = directReservations.flatMap((reservation) =>
    reservation.checkIn && reservation.checkOut
      ? [{ uid: `direct-${reservation.id}`, checkIn: reservation.checkIn, checkOut: reservation.checkOut, summary: 'Reservado' }]
      : [],
  );
  for (const [index, range] of groupBlockedDates(manualDays.map((day) => day.date)).entries()) {
    events.push({ uid: `manual-${range.checkIn}-${index}`, ...range, summary: 'No disponible' });
  }

  return new Response(buildPublicIcal(events), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="villa-isora.ics"',
      'Cache-Control': 'no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
