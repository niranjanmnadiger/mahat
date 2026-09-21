const { z } = require("zod");
const { objectId, dateTime } = require("./common.validation");

const STATUSES = ["booked", "completed", "cancelled"];

/**
 * A booking must say WHEN it starts. endTime is optional: leave it out and the
 * service layer derives it from the service duration.
 */
const createAppointmentSchema = z.object({
    body: z
        .object({
            customerId: objectId,
            providerId: objectId,
            serviceId: objectId,

            startTime: dateTime,
            endTime: dateTime.optional(),

            notes: z.string().trim().max(500).optional(),
        })
        .strict()
        .superRefine((value, ctx) => {
            if (value.endTime && value.endTime <= value.startTime) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["endTime"],
                    message: "endTime must be after startTime",
                });
            }
        }),
});

const rescheduleAppointmentSchema = z.object({
    params: z.object({ id: objectId }),
    body: z
        .object({
            startTime: dateTime,
            endTime: dateTime.optional(),
        })
        .strict()
        .superRefine((value, ctx) => {
            if (value.endTime && value.endTime <= value.startTime) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["endTime"],
                    message: "endTime must be after startTime",
                });
            }
        }),
});

const updateStatusSchema = z.object({
    params: z.object({ id: objectId }),
    body: z
        .object({
            status: z.enum(STATUSES, {
                errorMap: () => ({
                    message: `Status must be one of: ${STATUSES.join(", ")}`,
                }),
            }),
        })
        .strict(),
});

const listAppointmentSchema = z.object({
    query: z
        .object({
            providerId: objectId.optional(),
            customerId: objectId.optional(),
            status: z.enum(STATUSES).optional(),
            from: dateTime.optional(),
            to: dateTime.optional(),
        })
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

module.exports = {
    STATUSES,
    createAppointmentSchema,
    rescheduleAppointmentSchema,
    updateStatusSchema,
    listAppointmentSchema,
};
