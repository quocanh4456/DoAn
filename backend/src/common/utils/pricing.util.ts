const HOLIDAY_DATE_SET = new Set([
  '2026-01-01',
  '2026-02-16',
  '2026-02-17',
  '2026-02-18',
  '2026-02-19',
  '2026-02-20',
  '2026-02-21',
  '2026-02-22',
  '2026-04-30',
  '2026-05-01',
  '2026-09-02',
]);

function toDateString(dateInput: Date | string): string {
  if (typeof dateInput === 'string') return dateInput.slice(0, 10);
  return dateInput.toISOString().slice(0, 10);
}

export function getPriceMultiplierForDate(dateInput: Date | string): number {
  const date = new Date(toDateString(dateInput));
  const yyyyMmDd = toDateString(dateInput);

  if (HOLIDAY_DATE_SET.has(yyyyMmDd)) return 1.25;

  const day = date.getDay();
  if (day === 0 || day === 6) return 1.1;

  return 1;
}

export function calculateTripBasePrice(
  basePrice: number,
  dateInput: Date | string,
): number {
  const multiplier = getPriceMultiplierForDate(dateInput);
  return Math.round(basePrice * multiplier);
}

