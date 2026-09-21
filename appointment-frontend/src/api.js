// All the backend calls live in this one file.
// Every function returns a promise, and throws an Error if something went wrong.

const BASE_URL = "/api";

// The shared helper that every function below uses.
async function request(path, options = {}) {
  const response = await fetch(BASE_URL + path, {
    method: options.method || "GET",
    // Don't use the browser cache. Without this the browser can reply with a
    // 304 "Not Modified" that has no body, and there would be nothing to read.
    cache: "no-store",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // The backend always answers with JSON, in one of two shapes:
  //   success -> { success: true, data: ... }
  //   failure -> { success: false, message: "...", errors: ... }
  const result = await response.json();

  if (!response.ok) {
    throw new Error(readErrorMessage(result));
  }

  return result.data;
}

// Turns the backend's error response into one readable sentence.
function readErrorMessage(result) {
  let message = result.message || "Something went wrong";

  // Validation errors come back as a list: [{ field, message }]
  if (Array.isArray(result.errors)) {
    const details = result.errors.map((e) => `${e.field}: ${e.message}`).join(", ");
    return `${message} (${details})`;
  }

  // A double-booking (409) tells you which appointment is in the way.
  if (result.errors && result.errors.conflictsWith) {
    const clash = result.errors.conflictsWith;
    const from = new Date(clash.startTime).toLocaleString();
    const to = new Date(clash.endTime).toLocaleTimeString();
    return `${message}. Already booked: ${clash.customer} with ${clash.provider} for ${clash.service}, ${from} to ${to}`;
  }

  return message;
}

// Builds "?providerId=123&status=booked" and skips any empty values,
// because the backend rejects empty query values.
function toQueryString(filters) {
  const params = new URLSearchParams();
  for (const key in filters) {
    if (filters[key]) params.set(key, filters[key]);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

// ---------- Customers ----------

export function getCustomers() {
  return request("/customers");
}

export function createCustomer(customer) {
  return request("/customers", { method: "POST", body: customer });
}

export function deleteCustomer(id) {
  return request(`/customers/${id}`, { method: "DELETE" });
}

// ---------- Providers ----------

export function getProviders() {
  return request("/providers");
}

export function createProvider(provider) {
  return request("/providers", { method: "POST", body: provider });
}

export function deleteProvider(id) {
  return request(`/providers/${id}`, { method: "DELETE" });
}

// ---------- Services ----------

export function getServices() {
  return request("/services");
}

export function createService(service) {
  return request("/services", { method: "POST", body: service });
}

export function deleteService(id) {
  return request(`/services/${id}`, { method: "DELETE" });
}

// ---------- Appointments ----------

export function getAppointments(filters = {}) {
  return request(`/appointments${toQueryString(filters)}`);
}

export function createAppointment(appointment) {
  return request("/appointments", { method: "POST", body: appointment });
}

export function changeAppointmentStatus(id, status) {
  return request(`/appointments/${id}/status`, { method: "PATCH", body: { status } });
}

export function deleteAppointment(id) {
  return request(`/appointments/${id}`, { method: "DELETE" });
}
