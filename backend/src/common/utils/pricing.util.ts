const HOLIDAY_DATE_SET = new Set([
  '2025-01-01',
  '2025-01-27', '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31',
  '2025-02-01', '2025-02-02',
  '2025-04-30', '2025-05-01',
  '2025-09-02',
  '2026-01-01',
  '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19',
  '2026-02-20', '2026-02-21', '2026-02-22',
  '2026-04-30', '2026-05-01',
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

  return 1.0;
}


export function getOccupancyMultiplier(availableSeats: number, totalSeats: number): number {
  if (totalSeats <= 0) return 1.0;
  const occupancyRate = (totalSeats - availableSeats) / totalSeats;

  if (occupancyRate >= 0.9) return 1.20;
  if (occupancyRate >= 0.8) return 1.12;
  if (occupancyRate >= 0.6) return 1.05;
  return 1.0;
}


export function getLastMinuteMultiplier(departureDate: Date | string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const departure = new Date(toDateString(departureDate));
  departure.setHours(0, 0, 0, 0);

  const diffMs = departure.getTime() - today.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) return 1.15;
  if (diffDays <= 3) return 1.08;
  return 1.0;
}

export function calculateTripBasePrice(
  basePrice: number,
  dateInput: Date | string,
): number {
  const multiplier = getPriceMultiplierForDate(dateInput);
  return Math.round(basePrice * multiplier);
}

export interface PriceFactor {
  label: string;
  multiplier: number;
  active: boolean;
}

export interface DynamicPriceResult {
  basePrice: number;
  finalPrice: number;
  totalMultiplier: number;
  factors: PriceFactor[];
}


export function calculateDynamicPrice(
  basePrice: number,
  departureDate: Date | string,
  availableSeats: number,
  totalSeats: number,
  discountPercent: number = 0,
): DynamicPriceResult {
  const dateMult = getPriceMultiplierForDate(departureDate);
  const occupancyMult = getOccupancyMultiplier(availableSeats, totalSeats);
  const lastMinuteMult = getLastMinuteMultiplier(departureDate);

  const rawMultiplier = dateMult * occupancyMult * lastMinuteMult;
  const totalMultiplier = Math.min(rawMultiplier, 1.5);

  const discountFactor = discountPercent > 0 ? (100 - discountPercent) / 100 : 1;

  const finalPrice = Math.round((basePrice * totalMultiplier * discountFactor) / 1000) * 1000;

  const factors: PriceFactor[] = [
    {
      label: 'Ngày lễ',
      multiplier: dateMult,
      active: dateMult > 1.2,
    },
    {
      label: 'Cuối tuần',
      multiplier: dateMult,
      active: dateMult === 1.1,
    },
    {
      label: 'Ghế gần hết (> 80%)',
      multiplier: occupancyMult,
      active: occupancyMult > 1.0,
    },
    {
      label: 'Đặt gấp (≤ 3 ngày)',
      multiplier: lastMinuteMult,
      active: lastMinuteMult > 1.0,
    },
    {
      label: `Khuyến mãi giảm ${discountPercent}%`,
      multiplier: discountFactor,
      active: discountPercent > 0,
    },
  ];

  return {
    basePrice: Math.round(basePrice),
    finalPrice,
    totalMultiplier: Math.round(totalMultiplier * discountFactor * 100) / 100,
    factors,
  };
}