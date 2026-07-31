import { randomUUID } from 'node:crypto';
import { and, eq, gt, inArray, isNull, lt, sql } from 'drizzle-orm';
import { db } from '@/core/db';
import { calendarDays, guests, listings, reservations } from '@/core/db/schema';
import {
  DirectBookingConflictError,
  DirectBookingNotFoundError,
  occupiedDatesForStay,
  validateDirectBookingInput,
  type DirectBookingInput,
  type DirectBookingResult,
} from './direct-booking-policy';

export * from './direct-booking-policy';

const ACTIVE_RESERVATION_STATUSES = ['confirmed', 'pending'];

interface DirectBookingTestHooks {
  afterLock?: () => Promise<void>;
  afterReservationInsert?: () => Promise<void>;
}

export async function createDirectBookingForWorkspace(
  input: DirectBookingInput,
  testHooks: DirectBookingTestHooks = {},
): Promise<DirectBookingResult> {
  validateDirectBookingInput(input);

  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`${input.workspaceId}:${input.listingId}`}))`,
    );
    await testHooks.afterLock?.();

    const listing = (
      await tx
        .select({
          id: listings.id,
          currency: listings.currency,
          maxGuests: listings.maxGuests,
        })
        .from(listings)
        .where(
          and(eq(listings.workspaceId, input.workspaceId), eq(listings.id, input.listingId)),
        )
        .limit(1)
    )[0];
    if (!listing) throw new DirectBookingNotFoundError();
    validateDirectBookingInput(input, listing.maxGuests);

    const occupiedDates = occupiedDatesForStay(input.checkIn, input.checkOut);
    const [overlappingReservation, unavailableManualDay] = await Promise.all([
      tx
        .select({ id: reservations.id })
        .from(reservations)
        .where(
          and(
            eq(reservations.workspaceId, input.workspaceId),
            eq(reservations.listingId, input.listingId),
            inArray(reservations.status, ACTIVE_RESERVATION_STATUSES),
            lt(reservations.checkIn, input.checkOut),
            gt(reservations.checkOut, input.checkIn),
          ),
        )
        .limit(1),
      tx
        .select({ id: calendarDays.id })
        .from(calendarDays)
        .where(
          and(
            eq(calendarDays.workspaceId, input.workspaceId),
            eq(calendarDays.listingId, input.listingId),
            eq(calendarDays.available, false),
            isNull(calendarDays.reservationId),
            inArray(calendarDays.date, occupiedDates),
          ),
        )
        .limit(1),
    ]);
    if (overlappingReservation[0] || unavailableManualDay[0]) {
      throw new DirectBookingConflictError();
    }

    const guest = (
      await tx
        .insert(guests)
        .values({
          workspaceId: input.workspaceId,
          externalGuestId: `direct-guest-${randomUUID()}`,
          name: input.guestName.trim(),
          email: input.guestEmail?.trim() || null,
          phone: input.guestPhone?.trim() || null,
          raw: { source: 'direct-booking', synthetic: true },
        })
        .returning({ id: guests.id })
    )[0]!;

    const externalReservationId = `direct-${randomUUID()}`;
    const confirmationCode = `DIRECT-${externalReservationId.slice(-8).toUpperCase()}`;
    const nameParts = input.guestName.trim().split(/\s+/);
    const firstName = nameParts.shift()!;
    const lastName = nameParts.join(' ');
    const reservation = (
      await tx
        .insert(reservations)
        .values({
          workspaceId: input.workspaceId,
          listingId: input.listingId,
          guestId: guest.id,
          externalReservationId,
          confirmationCode,
          platform: 'direct',
          status: 'confirmed',
          checkIn: input.checkIn,
          checkOut: input.checkOut,
          nights: occupiedDates.length,
          guestCount: input.guestCount,
          totalPrice: input.totalPrice != null ? String(input.totalPrice) : null,
          currency: listing.currency,
          guestDetails: {
            firstName,
            lastName,
            email: input.guestEmail?.trim() || null,
            phone: input.guestPhone?.trim() || null,
          },
          raw: { source: 'direct-booking', synthetic: true },
        })
        .returning({ id: reservations.id })
    )[0]!;

    await testHooks.afterReservationInsert?.();
    await replaceReservationCalendarProjection(tx, {
      reservationId: reservation.id,
      workspaceId: input.workspaceId,
      listingId: input.listingId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      status: 'confirmed',
      confirmationCode,
    });

    return {
      id: reservation.id,
      confirmationCode,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      nights: occupiedDates.length,
      currency: listing.currency ?? '',
    };
  });
}

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function replaceReservationCalendarProjection(
  tx: Transaction,
  reservation: {
    reservationId: string;
    workspaceId: string;
    listingId: string;
    checkIn: string;
    checkOut: string;
    status: string | null;
    confirmationCode: string | null;
  },
): Promise<void> {
  await tx.delete(calendarDays).where(eq(calendarDays.reservationId, reservation.reservationId));
  if (!ACTIVE_RESERVATION_STATUSES.includes(reservation.status ?? '')) return;

  const dates = occupiedDatesForStay(reservation.checkIn, reservation.checkOut);
  if (dates.length === 0) return;
  await tx.insert(calendarDays).values(
    dates.map((date) => ({
      workspaceId: reservation.workspaceId,
      listingId: reservation.listingId,
      reservationId: reservation.reservationId,
      date,
      available: false,
      blockedReason: reservation.confirmationCode,
      source: 'reservation',
      updatedAt: new Date(),
    })),
  );
}
