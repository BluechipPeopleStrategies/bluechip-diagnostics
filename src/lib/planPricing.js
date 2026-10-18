// Owner-confirmed October 17, 2026. Change the fee here for future bookings;
// an already agreed fee and the purchaser's policy version remain unchanged.
export const PLAN_FEE = 795;
// Fixed educational illustration, never calculated from a visitor's answers.
export const PLAN_TIME_VALUE_EXAMPLE = Object.freeze({ hours: 3, weeks: 48, hourlyRate: 40, annualValue: 3 * 48 * 40 });
export const dollars = value => `C$${value.toLocaleString('en-CA')}`;
export const FUTURE_PRICE_NOTICE = "Pricing for future bookings may change at BlueChip's sole discretion. Your fee is confirmed before you book.";
