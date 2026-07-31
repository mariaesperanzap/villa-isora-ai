export interface DirectBookingInput {
  workspaceId: string;
  listingId: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail?: string | null;
  guestPhone?: string | null;
  guestCount: number;
  totalPrice?: number | null;
}

export interface DirectBookingResult {
  id: string;
  confirmationCode: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  currency: string;
}

export class DirectBookingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DirectBookingValidationError';
  }
}

export class DirectBookingConflictError extends Error {
  constructor() {
    super('The selected dates are not available.');
    this.name = 'DirectBookingConflictError';
  }
}

export class DirectBookingNotFoundError extends Error {
  constructor() {
    super('The property was not found.');
    this.name = 'DirectBookingNotFoundError';
  }
}

export function validateDirectBookingInput(
  input: DirectBookingInput,
  maxGuests?: number | null,
): void {
  if (!isIsoDate(input.checkIn) || !isIsoDate(input.checkOut)) {
    throw new DirectBookingValidationError('Enter valid check-in and check-out dates.');
  }
  if (input.checkOut <= input.checkIn) {
    throw new DirectBookingValidationError('Check-out must be after check-in.');
  }
  if (!input.guestName.trim()) {
    throw new DirectBookingValidationError('Guest name is required.');
  }
  if (!Number.isInteger(input.guestCount) || input.guestCount < 1) {
    throw new DirectBookingValidationError('Guest count must be a positive whole number.');
  }
  if (maxGuests != null && input.guestCount > maxGuests) {
    throw new DirectBookingValidationError(`This property allows at most ${maxGuests} guests.`);
  }
  if (
    input.totalPrice != null &&
    (!Number.isFinite(input.totalPrice) || input.totalPrice < 0)
  ) {
    throw new DirectBookingValidationError('Total price must be a valid non-negative number.');
  }
}

export function rangesOverlap(
  firstCheckIn: string,
  firstCheckOut: string,
  secondCheckIn: string,
  secondCheckOut: string,
): boolean {
  return firstCheckIn < secondCheckOut && firstCheckOut > secondCheckIn;
}

export function occupiedDatesForStay(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${checkIn}T00:00:00.000Z`);
  const end = new Date(`${checkOut}T00:00:00.000Z`);
  while (cursor < end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
