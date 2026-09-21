import { compact, request } from "./client";

/**
 * One object per resource, mirroring the route table in appointment-ts.
 * Bodies contain only the keys the Zod schemas accept.
 */

export const customersApi = {
  list: () => request("/customers"),
  create: ({ name, phone, email }) =>
    request("/customers", { method: "POST", body: compact({ name, phone, email }) }),
  remove: (id) => request(`/customers/${id}`, { method: "DELETE" }),
};

export const providersApi = {
  list: () => request("/providers"),
  create: ({ name, type, phone, email }) =>
    request("/providers", { method: "POST", body: compact({ name, type, phone, email }) }),
  remove: (id) => request(`/providers/${id}`, { method: "DELETE" }),
};

export const servicesApi = {
  list: (providerId) => request("/services", { query: { providerId } }),
  create: ({ name, price, durationMinutes, providerId, description }) =>
    request("/services", {
      method: "POST",
      body: compact({
        name,
        price: Number(price),
        durationMinutes: Number(durationMinutes),
        providerId,
        description,
      }),
    }),
  remove: (id) => request(`/services/${id}`, { method: "DELETE" }),
};

export const appointmentsApi = {
  // filters: { providerId, customerId, serviceId, status, from, to } - empty ones are dropped
  list: (filters = {}) => request("/appointments", { query: filters }),

  // No endTime: the API derives it from the service's duration and rejects it if sent.
  create: ({ customerId, providerId, serviceId, startTime, notes }) =>
    request("/appointments", {
      method: "POST",
      body: compact({ customerId, providerId, serviceId, startTime, notes }),
    }),

  reschedule: (id, startTime) =>
    request(`/appointments/${id}/reschedule`, { method: "PATCH", body: { startTime } }),

  setStatus: (id, status) =>
    request(`/appointments/${id}/status`, { method: "PATCH", body: { status } }),

  remove: (id) => request(`/appointments/${id}`, { method: "DELETE" }),
};
