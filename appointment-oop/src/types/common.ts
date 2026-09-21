/** An id as it arrives from a URL or a request body. */
export type Id = string;

export type AppointmentStatus = "booked" | "completed" | "cancelled";

export const APPOINTMENT_STATUSES: readonly AppointmentStatus[] = ["booked", "completed", "cancelled"] as const;

/** Every successful response uses this envelope. */
export interface SuccessResponse<T> {
    success: true;
    data: T;
}
