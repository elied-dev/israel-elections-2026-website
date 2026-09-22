import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatDatePrecision } from '../src/date-precision';

const date = new Date('2026-09-22T00:00:00Z');

test('formats public dates by declared precision without inventing detail', () => {
  assert.equal(formatDatePrecision(date, 'day'), '2026-09-22');
  assert.equal(formatDatePrecision(date, 'month'), 'September 2026');
  assert.equal(formatDatePrecision(date, 'year'), '2026');
  assert.equal(formatDatePrecision(null, 'unknown'), 'Date unknown');
});
