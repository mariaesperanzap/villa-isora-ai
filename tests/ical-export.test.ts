import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPublicIcal, groupBlockedDates } from '../core/services/ical/export';

test('exports availability without guest names, prices or contact details', () => {
  const output = buildPublicIcal([{
    uid: 'direct-safe-id', checkIn: '2026-12-20', checkOut: '2026-12-24', summary: 'Reservado',
  }], new Date('2026-10-22T10:00:00.000Z'));
  assert.match(output, /DTSTART;VALUE=DATE:20261220/);
  assert.match(output, /DTEND;VALUE=DATE:20261224/);
  assert.match(output, /SUMMARY:Reservado/);
  assert.doesNotMatch(output, /email|phone|price|guest/i);
});

test('groups consecutive manual blocks and keeps gaps separate', () => {
  assert.deepEqual(groupBlockedDates(['2026-12-03', '2026-12-01', '2026-12-02', '2026-12-06']), [
    { checkIn: '2026-12-01', checkOut: '2026-12-04' },
    { checkIn: '2026-12-06', checkOut: '2026-12-07' },
  ]);
});
