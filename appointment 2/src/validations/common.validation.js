const { z } = require("zod");

/**
 * A 24 character hex string. Validating here means a malformed id is rejected
 * with a clean 400 instead of reaching Mongo and throwing a CastError.
 */
const objectId = z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, "Must be a valid MongoDB ObjectId");

/**
 * Accepts an ISO-8601 string (or a Date) and coerces it to a Date.
 * Anything that is not parseable is rejected.
 */
const dateTime = z
    .union([z.string().trim().min(1, "Date is required"), z.date()])
    .pipe(z.coerce.date());

const idParamSchema = z.object({
    params: z.object({
        id: objectId,
    }),
});

const phone = z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{10,15}$/, "Phone must be 10-15 digits");

const email = z.string().trim().toLowerCase().email("Invalid email address");

module.exports = {
    objectId,
    dateTime,
    idParamSchema,
    phone,
    email,
};
