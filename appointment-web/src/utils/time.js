/**
 * Times go to the API as UTC ISO strings (toISOString), which satisfies its
 * strict "ISO-8601 with a zone" rule. Times are shown in the browser's zone.
 */

const pad = (n) => String(n).padStart(2, "0");

export const MS_PER_MINUTE = 60 * 1000;

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * MS_PER_MINUTE);
}

/** Date -> "2026-09-01" in local time, the value format of <input type="date"> */
export function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Date -> "2026-09-01T10:00", the value format of <input type="datetime-local"> */
export function toLocalInputValue(date) {
  return `${toDateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "2026-09-01T10:00" (local) -> Date, or null if empty or invalid */
export function fromLocalInputValue(value) {
  if (!value) return null;
  const date = new Date(value); // no offset in the string, so JS reads it as local time
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "2026-09-01" -> local midnight */
export function startOfDay(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "2026-09-01" -> 23:59:59.999 local (built from tomorrow's midnight, so DST-safe) */
export function endOfDay(dateKey) {
  return new Date(startOfDay(shiftDay(dateKey, 1)).getTime() - 1);
}

export function shiftDay(dateKey, days) {
  const date = startOfDay(dateKey);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

const hourFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric" });
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" });
const longDayFormat = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" });

export const formatHour = (value) => hourFormat.format(new Date(value));
export const formatTime = (value) => timeFormat.format(new Date(value));
export const formatDay = (value) => dayFormat.format(new Date(value));
export const formatLongDay = (value) => longDayFormat.format(new Date(value));
export const formatRange = (start, end) => `${formatTime(start)} – ${formatTime(end)}`;

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const formatPrice = (value) => money.format(value);
