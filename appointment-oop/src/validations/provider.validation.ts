import { z } from "zod";
import { phone } from "./common.validation";

export const createProviderBody = z
    .object({
        name: z.string().trim().min(1, "Name is required").max(120),
        type: z.string().trim().min(1, "Type is required").max(80),
        phone: phone.optional(),
        email: z.string().trim().email("Must be a valid email").optional(),
    })
    .strict();

export type CreateProviderBody = z.infer<typeof createProviderBody>;
