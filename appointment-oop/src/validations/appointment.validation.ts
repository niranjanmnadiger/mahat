import { z } from "zod";
import { APPOINTMENT_STATUSES } from "../types/common";
import { isoDateTime, objectId } from "./common.validation";

/**
 * Note what is NOT here: `endTime`.
 *
 * It is derived from the service's duration by TimeSlot, so the API refuses to
 * accept it at all. Because the schema is strict, sending it returns a 400
 * rather than being quietly ignored.
 */
export const createAppointmentBody = z
    .object({
        customerId: objectId,
        providerId: objectId,
        serviceId: objectId,
        startTime: isoDateTime,
        notes: z.string().trim().max(500).optional(),
    })
    .strict();

export const rescheduleBody = z.object({ startTime: isoDateTime }).strict();

/** booked -> completed | cancelled. "booked" is not a target anyone can set. */
export const changeStatusBody = z
    .object({ status: z.enum(["completed", "cancelled"]) })
    .strict();

/**
 * Strict here too, so `?providerid=` (wrong case) is a 400 instead of being
 * ignored and quietly returning every appointment in the database.
 */
export const listAppointmentQuery = z
    .object({
        providerId: objectId.optional(),
        customerId: objectId.optional(),
        serviceId: objectId.optional(),
        status: z.enum(APPOINTMENT_STATUSES as unknown as [string, ...string[]]).optional(),
        from: isoDateTime.optional(),
        to: isoDateTime.optional(),
    })
    .strict()
    .refine(
        (value) => !value.from || !value.to || value.from <= value.to,
        { message: "'from' must be earlier than 'to'", path: ["from"] }
    );

export type CreateAppointmentBody = z.infer<typeof createAppointmentBody>;
