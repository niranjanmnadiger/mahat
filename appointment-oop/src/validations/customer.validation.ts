import { z } from "zod";
import { phone } from "./common.validation";

/**
 * `.strict()` rejects any key the schema does not name.
 *
 * A typo like `{ "nmae": "Gagan" }` becomes a 400 that says so, instead of
 * silently creating a customer with no name.
 */
export const createCustomerBody = z
    .object({
        name: z.string().trim().min(1, "Name is required").max(120),
        phone,
        email: z.string().trim().email("Must be a valid email").optional(),
    })
    .strict();

export type CreateCustomerBody = z.infer<typeof createCustomerBody>;
