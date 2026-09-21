// Small date helpers, used by more than one page.

// "2026-09-20T14:30" from the date input  ->  "2026-09-20T09:00:00.000Z"
// The backend only accepts a full ISO timestamp with a timezone, and
// toISOString() always produces one.
export function toApiTime(inputValue) {
  return new Date(inputValue).toISOString();
}

// "2026-09-20T09:00:00.000Z"  ->  "20/09/2026, 2:30 pm" in the user's timezone
export function showDateTime(isoString) {
  return new Date(isoString).toLocaleString();
}

export function showTime(isoString) {
  return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
