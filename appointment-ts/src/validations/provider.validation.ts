import { z } from "zod";
import { email, personName, phone } from "./common.validation";

export const createProviderSchema = z.object({
    body: z
        .object({
            name: personName,

            // Kept open (admin, cardio, neuro, barber, consultant...) rather
            // than an enum, so new provider types do not need a code change.
            type: z
                .string()
                .trim()
                .min(2, "Type must contain at least 2 characters")
                .max(50, "Type is too long"),

            phone: phone.optional(),
            email: email.optional(),
        })
        .strict(),
});

export type CreateProviderBody = z.infer<typeof createProviderSchema>["body"];
