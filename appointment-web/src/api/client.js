/**
 * The one place that talks HTTP.
 *
 * appointment-ts replies with { success: true, data } on success and
 * { success: false, message, errors? } on failure. This wrapper unwraps `data`
 * and turns every failure into an ApiRequestError, so components only ever
 * deal with plain data or one error type.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

export class ApiRequestError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status; // 0 means the server was never reached
    this.errors = errors; // [{ field, message }] for 400s, { conflictsWith } for clashes
  }
}

/**
 * The API validates bodies strictly, so an optional field sent as "" fails
 * (an empty email is not an email). Drop empty values instead of sending them.
 */
export function compact(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== "" && value !== null && value !== undefined)
  );
}

export async function request(path, { method = "GET", body, query } = {}) {
  const url = new URL(BASE_URL + path, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(compact(query))) {
      url.searchParams.set(key, value);
    }
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      cache: "no-store", // never send If-None-Match, so every reply has a body
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiRequestError(0, "Can't reach the API. Check that the backend is running on port 3000.");
  }

  // 204 and 304 both arrive with no body to parse.
  const hasBody = response.status !== 204 && response.status !== 304;
  const payload = hasBody ? await response.json().catch(() => null) : null;

  if ((!response.ok && response.status !== 304) || payload?.success === false) {
    throw new ApiRequestError(
      response.status,
      payload?.message ?? `Request failed with status ${response.status}`,
      payload?.errors
    );
  }

  return payload?.data ?? payload;
}
