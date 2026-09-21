import { z } from "zod";
import { objectId } from "./common.validation";

export const createServiceBody = z
    .object({
        name: z.string().trim().min(1, "Name is required").max(120),
        price: z.number().nonnegative("Price cannot be negative"),
        durationMinutes: z
            .number()
            .int("Duration must be a whole number of minutes")
            .min(5, "Minimum 5 minutes")
            .max(480, "Maximum 8 hours"),
        providerId: objectId,
        description: z.string().trim().max(500).optional(),
    })
    .strict();

export const listServiceQuery = z.object({ providerId: objectId.optional() }).strict();

export type CreateServiceBody = z.infer<typeof createServiceBody>;
