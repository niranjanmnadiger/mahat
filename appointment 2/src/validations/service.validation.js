const { z } = require("zod");
const { objectId } = require("./common.validation");

const createServiceSchema = z.object({
    body: z
        .object({
            name: z
                .string()
                .trim()
                .min(2, "Name must contain at least 2 characters")
                .max(100, "Name is too long"),

            description: z.string().trim().max(500).optional(),

            price: z
                .number({ invalid_type_error: "Price must be a number" })
                .nonnegative("Price cannot be negative"),

            durationMinutes: z
                .number({ invalid_type_error: "durationMinutes must be a number" })
                .int("durationMinutes must be a whole number")
                .min(1, "durationMinutes must be at least 1")
                .max(1440, "durationMinutes cannot exceed 24 hours"),

            providerId: objectId,
        })
        .strict(),
});

const listServiceSchema = z.object({
    query: z.object({
        providerId: objectId.optional(),
    }),
});

module.exports = {
    createServiceSchema,
    listServiceSchema,
};
