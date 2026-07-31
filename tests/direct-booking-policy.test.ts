import assert from 'node:assert/strict';
import test from 'node:test';
import {
  occupiedDatesForStay,
  rangesOverlap,
  validateDirectBookingInput,
  type DirectBookingInput,
} from '../core/services/direct-booking-policy';

const valid: DirectBookingInput = {
  workspaceId: 'workspace',
  listingId: 'listing',
  checkIn: '2026-08-10',
  checkOut: '2026-08-13',
  guestName: 'Ana Prueba',
  guestCount: 2,
  totalPrice: 600,
};

test('validates a booking and treats checkout as exclusive', () => {
  validateDirectBookingInput(valid, 8);
  assert.deepEqual(occupiedDatesForStay(valid.checkIn, valid.checkOut), [
    '2026-08-10',
    '2026-08-11',
    '2026-08-12',
  ]);
});

for (const [name, input] of [
  ['invalid date', { ...valid, checkIn: '2026-02-30' }],
  ['checkout equal to checkin', { ...valid, checkOut: valid.checkIn }],
  ['checkout before checkin', { ...valid, checkOut: '2026-08-09' }],
  ['empty guest', { ...valid, guestName: '  ' }],
  ['zero guests', { ...valid, guestCount: 0 }],
  ['fractional guests', { ...valid, guestCount: 1.5 }],
  ['negative price', { ...valid, totalPrice: -1 }],
  ['invalid price', { ...valid, totalPrice: Number.NaN }],
] as const) {
  test(`rejects ${name}`, () => {
    assert.throws(() => validateDirectBookingInput(input, 8));
  });
}

test('rejects guest count above property capacity', () => {
  assert.throws(() => validateDirectBookingInput({ ...valid, guestCount: 9 }, 8));
});

test('detects partial, contained, and containing overlaps', () => {
  assert.equal(rangesOverlap('2026-08-09', '2026-08-11', '2026-08-10', '2026-08-13'), true);
  assert.equal(rangesOverlap('2026-08-11', '2026-08-12', '2026-08-10', '2026-08-13'), true);
  assert.equal(rangesOverlap('2026-08-09', '2026-08-14', '2026-08-10', '2026-08-13'), true);
  assert.equal(rangesOverlap('2026-08-07', '2026-08-10', '2026-08-10', '2026-08-13'), false);
});
