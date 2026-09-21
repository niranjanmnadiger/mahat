const { z } = require("zod");
const { phone, email } = require("./common.validation");

const createProviderSchema = z.object({
    body: z
        .object({
            name: z
                .string()
                .trim()
                .min(2, "Name must contain at least 2 characters")
                .max(100, "Name is too long"),

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

module.exports = {
    createProviderSchema,
};
