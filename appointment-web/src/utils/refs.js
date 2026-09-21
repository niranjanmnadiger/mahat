/**
 * Appointment responses come back with customerId / providerId / serviceId
 * populated into objects; other responses may carry bare ObjectId strings.
 * These two helpers read either shape.
 */
export function refId(ref) {
  if (!ref) return "";
  return typeof ref === "string" ? ref : ref._id;
}

export function refName(ref, lookup = []) {
  if (!ref) return "Unknown";
  if (typeof ref === "object" && ref.name) return ref.name;
  return lookup.find((item) => item._id === refId(ref))?.name ?? "Unknown";
}
