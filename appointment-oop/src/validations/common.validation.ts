import { z } from "zod";

/** A 24-character hex MongoDB ObjectId. */
export const objectId = z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, "Must be a valid id");

/**
 * Accepts "+91 98765-43210", "098765 43210" or "9876543210" and normalises
 * all of them to exactly ten digits before anything else sees the value.
 */
export const phone = z
    .string()
    .trim()
    .transform((value) => value.replace(/[\s\-()]/g, "").replace(/^\+91/, "").replace(/^0/, ""))
    .refine((value) => /^\d{10}$/.test(value), "Phone must be exactly 10 digits");

/**
 * Requires a real ISO-8601 timestamp WITH a zone, so "2026-09-15T10:00:00Z" and
 * "2026-09-15T10:00:00+05:30" pass while "2026-09-15 10:00" and "2026" do not.
 *
 * Without the zone, the server and the browser would each guess a different
 * offset and a 10am booking could land at 4:30am.
 */
export const isoDateTime = z
    .string()
    .trim()
    .regex(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/,
        "Must be an ISO-8601 timestamp with a timezone, e.g. 2026-09-15T10:00:00.000Z"
    )
    .transform((value) => new Date(value))
    .refine((date) => !Number.isNaN(date.getTime()), "Not a real date");

export const idParams = z.object({ id: objectId }).strict();
