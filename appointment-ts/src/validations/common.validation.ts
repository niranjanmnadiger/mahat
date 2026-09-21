import { z } from "zod";

/**
 * A 24 character hex string. Validating here means a malformed id is rejected
 * with a clean 400 instead of reaching Mongo and throwing a CastError.
 */
export const objectId = z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, "Must be a valid MongoDB ObjectId");

/**
 * Strict ISO-8601 date-time, coerced to a Date.
 *
 * `new Date("tomorrow morning")` is Invalid Date and `new Date("2026")` is
 * silently 1 Jan, so free-form parsing is not accepted - the caller must send
 * "2026-09-01T10:00:00.000Z" or "2026-09-01T10:00:00+05:30".
 */
export const dateTime = z
    .string({ required_error: "Date is required" })
    .trim()
    .datetime({
        offset: true,
        message: "Must be an ISO-8601 date-time, e.g. 2026-09-01T10:00:00.000Z",
    })
    .transform((value) => new Date(value));

/**
 * Exactly 10 digits after normalisation.
 *
 * Separators are stripped and a leading +91 / 91 / 0 is removed, so
 * "+91 98765-43210" and "9876543210" are the same number. Anything that is not
 * a 10 digit mobile after that is rejected.
 */
export const phone = z
    .string({ required_error: "Phone is required" })
    .trim()
    .transform((value) => {
        const digits = value.replace(/\D/g, "");

        if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
        if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);

        return digits;
    })
    .pipe(
        z
            .string()
            .regex(/^[6-9]\d{9}$/, "Phone must be a 10 digit mobile number")
    );

export const email = z.string().trim().toLowerCase().email("Invalid email address");

export const personName = z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .max(100, "Name is too long");

export const idParamSchema = z.object({
    params: z.object({
        id: objectId,
    }),
});
