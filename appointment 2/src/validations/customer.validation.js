const { z } = require("zod");
const { phone, email } = require("./common.validation");

const createCustomerSchema = z.object({
    body: z
        .object({
            name: z
                .string()
                .trim()
                .min(2, "Name must contain at least 2 characters")
                .max(100, "Name is too long"),

            phone: phone,

            email: email.optional(),
        })
        .strict(),
});

module.exports = {
    createCustomerSchema,
};
