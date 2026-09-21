import { z } from "zod";
import { APPOINTMENT_STATUSES } from "../models/appointment.model";
import { dateTime, objectId } from "./common.validation";

/**
 * A booking says WHO, WITH WHOM, FOR WHAT and WHEN IT STARTS.
 *
 * It deliberately does NOT accept an end time. The slot length comes from the
 * booked service's durationMinutes, so the customer only chooses their start.
 * Because the body is `.strict()`, sending `endTime` now fails loudly with a
 * 400 instead of quietly overriding the service duration.
 */
export const createAppointmentSchema = z.object({
    body: z
        .object({
            customerId: objectId,
            providerId: objectId,
            serviceId: objectId,

            startTime: dateTime,

            notes: z.string().trim().max(500, "Notes are too long").optional(),
        })
        .strict(),
});

export const rescheduleAppointmentSchema = z.object({
    params: z.object({ id: objectId }),
    body: z
        .object({
            startTime: dateTime,
        })
        .strict(),
});

export const updateStatusSchema = z.object({
    params: z.object({ id: objectId }),
    body: z
        .object({
            status: z.enum(APPOINTMENT_STATUSES),
        })
        .strict(),
});

export const listAppointmentSchema = z.object({
    query: z
        .object({
            providerId: objectId.optional(),
            customerId: objectId.optional(),
            serviceId: objectId.optional(),
            status: z.enum(APPOINTMENT_STATUSES).optional(),
            from: dateTime.optional(),
            to: dateTime.optional(),
        })
        .strict()
        .superRefine((value, ctx) => {
            if (value.from && value.to && value.to < value.from) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["to"],
                    message: "`to` must be the same as or after `from`",
                });
            }
        }),
});

export type CreateAppointmentBody = z.infer<typeof createAppointmentSchema>["body"];
export type RescheduleAppointmentBody = z.infer<typeof rescheduleAppointmentSchema>["body"];
export type UpdateStatusBody = z.infer<typeof updateStatusSchema>["body"];
export type AppointmentFilters = z.infer<typeof listAppointmentSchema>["query"];
