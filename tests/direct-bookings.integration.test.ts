import assert from 'node:assert/strict';
import test, { before, beforeEach } from 'node:test';
import { and, count, eq } from 'drizzle-orm';
import { db } from '../core/db';
import {
  calendarDays,
  guests,
  listings,
  reservations,
  users,
  workspaceMembers,
  workspaces,
} from '../core/db/schema';
import {
  createDirectBookingForWorkspace,
  DirectBookingConflictError,
  replaceReservationCalendarProjection,
} from '../core/services/direct-bookings';

let workspaceId: string;
let listingId: string;

const booking = (overrides: Record<string, unknown> = {}) => ({
  workspaceId,
  listingId,
  checkIn: '2030-08-10',
  checkOut: '2030-08-13',
  guestName: 'Ana Integración',
  guestEmail: 'ana@example.test',
  guestCount: 2,
  totalPrice: 600,
  ...overrides,
});

before(async () => {
  const user = (
    await db
      .insert(users)
      .values({ email: 'integration@example.test', name: 'Integration' })
      .onConflictDoUpdate({
        target: users.email,
        set: { name: 'Integration' },
      })
      .returning({ id: users.id })
  )[0]!;
  const workspace = (
    await db
      .insert(workspaces)
      .values({
        name: 'Integration',
        slug: 'integration',
        ownerUserId: user.id,
        autoPushCalendar: false,
        atlasRecommendationsEnabled: false,
      })
      .onConflictDoUpdate({
        target: workspaces.slug,
        set: { ownerUserId: user.id },
      })
      .returning({ id: workspaces.id })
  )[0]!;
  workspaceId = workspace.id;
  await db
    .insert(workspaceMembers)
    .values({ workspaceId, userId: user.id, role: 'owner' })
    .onConflictDoNothing();
  const listing = (
    await db
      .insert(listings)
      .values({
        workspaceId,
        externalListingId: 'integration-villa-isora',
        name: 'Villa Isora',
        currency: 'CRC',
        maxGuests: 4,
      })
      .returning({ id: listings.id })
  )[0]!;
  listingId = listing.id;
});

beforeEach(async () => {
  await db.delete(calendarDays).where(eq(calendarDays.workspaceId, workspaceId));
  await db.delete(reservations).where(eq(reservations.workspaceId, workspaceId));
  await db.delete(guests).where(eq(guests.workspaceId, workspaceId));
});

test('transaction creates guest, canonical reservation and linked calendar projection', async () => {
  const result = await createDirectBookingForWorkspace(booking());
  assert.equal(result.currency, 'CRC');

  const [guestCount] = await db
    .select({ value: count() })
    .from(guests)
    .where(eq(guests.workspaceId, workspaceId));
  const reservation = (
    await db
      .select()
      .from(reservations)
      .where(eq(reservations.id, result.id))
      .limit(1)
  )[0]!;
  const projection = await db
    .select()
    .from(calendarDays)
    .where(eq(calendarDays.reservationId, result.id));

  assert.equal(guestCount.value, 1);
  assert.equal(reservation.currency, 'CRC');
  assert.equal(reservation.guestCount, 2);
  assert.equal(projection.length, 3);
  assert.ok(projection.every((day) => day.source === 'reservation'));
});

test('rollback removes guest, reservation and projection after an injected failure', async () => {
  await assert.rejects(() =>
    createDirectBookingForWorkspace(booking(), {
      afterReservationInsert: async () => {
        throw new Error('forced rollback');
      },
    }),
  );
  const [guestCount, reservationCount, projectionCount] = await Promise.all([
    db.select({ value: count() }).from(guests).where(eq(guests.workspaceId, workspaceId)),
    db
      .select({ value: count() })
      .from(reservations)
      .where(eq(reservations.workspaceId, workspaceId)),
    db
      .select({ value: count() })
      .from(calendarDays)
      .where(eq(calendarDays.workspaceId, workspaceId)),
  ]);
  assert.deepEqual(
    [guestCount[0]!.value, reservationCount[0]!.value, projectionCount[0]!.value],
    [0, 0, 0],
  );
});

test('overlap query rejects partial, contained and containing stays', async () => {
  await createDirectBookingForWorkspace(booking());
  for (const dates of [
    { checkIn: '2030-08-09', checkOut: '2030-08-11' },
    { checkIn: '2030-08-11', checkOut: '2030-08-12' },
    { checkIn: '2030-08-09', checkOut: '2030-08-14' },
  ]) {
    await assert.rejects(
      () => createDirectBookingForWorkspace(booking(dates)),
      DirectBookingConflictError,
    );
  }
});

test('cancelled reservation releases its projection and no longer conflicts', async () => {
  const created = await createDirectBookingForWorkspace(booking());
  await db.transaction(async (tx) => {
    await tx
      .update(reservations)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(reservations.id, created.id));
    await replaceReservationCalendarProjection(tx, {
      reservationId: created.id,
      workspaceId,
      listingId,
      checkIn: '2030-08-10',
      checkOut: '2030-08-13',
      status: 'cancelled',
      confirmationCode: created.confirmationCode,
    });
  });
  const linked = await db
    .select()
    .from(calendarDays)
    .where(eq(calendarDays.reservationId, created.id));
  assert.equal(linked.length, 0);
  await createDirectBookingForWorkspace(booking());
});

test('advisory lock serializes concurrent attempts and prevents double booking', async () => {
  let release!: () => void;
  let locked!: () => void;
  const lockReached = new Promise<void>((resolve) => {
    locked = resolve;
  });
  const hold = new Promise<void>((resolve) => {
    release = resolve;
  });

  const first = createDirectBookingForWorkspace(booking(), {
    afterLock: async () => {
      locked();
      await hold;
    },
  });
  await lockReached;
  let secondSettled = false;
  const second = createDirectBookingForWorkspace(booking()).finally(() => {
    secondSettled = true;
  });
  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.equal(secondSettled, false);
  release();
  await first;
  await assert.rejects(() => second, DirectBookingConflictError);

  const rows = await db
    .select()
    .from(reservations)
    .where(
      and(
        eq(reservations.workspaceId, workspaceId),
        eq(reservations.listingId, listingId),
      ),
    );
  assert.equal(rows.length, 1);
});
