import { z } from "zod";
import { objectId, personName } from "./common.validation";

export const createServiceSchema = z.object({
    body: z
        .object({
            name: personName,

            description: z.string().trim().max(500, "Description is too long").optional(),

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

export const listServiceSchema = z.object({
    query: z
        .object({
            providerId: objectId.optional(),
        })
        .strict(),
});

export type CreateServiceBody = z.infer<typeof createServiceSchema>["body"];
export type ServiceFilters = z.infer<typeof listServiceSchema>["query"];
