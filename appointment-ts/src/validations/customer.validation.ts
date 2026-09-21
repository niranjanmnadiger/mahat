import { z } from "zod";
import { email, personName, phone } from "./common.validation";

export const createCustomerSchema = z.object({
    body: z
        .object({
            name: personName,
            phone: phone,
            email: email.optional(),
        })
        .strict(),
});

export type CreateCustomerBody = z.infer<typeof createCustomerSchema>["body"];
