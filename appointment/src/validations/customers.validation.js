const { z } = require("zod");

const createCustomerSchema = z.object({
    body: z.object({
        name: z
            .string()
            .trim()
            .min(2, "Name must contain at least 2 characters"),

        phone: z
            .string()
            .trim()
            .min(10, "Phone number must contain at least 10 digits"),

        email: z
            .string()
            .email("Invalid email address")
            .optional(),
    }),
});

module.exports = {
    createCustomerSchema,
};