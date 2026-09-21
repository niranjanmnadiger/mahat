import type { RequestHandler } from "express";
import type { ZodError, ZodTypeAny } from "zod";

import ApiError from "../utils/ApiError";

export interface FieldIssue {
    field: string;
    message: string;
}

/**
 * Flattens Zod issues into a compact, client-friendly array.
 * `body.startTime` reads better than a nested tree.
 */
export function formatIssues(error: ZodError): FieldIssue[] {
    return error.issues.map((issue) => ({
        field: issue.path.join(".") || "(root)",
        message: issue.message,
    }));
}

interface ParsedRequest {
    body?: unknown;
    params?: unknown;
    query?: Record<string, unknown>;
}

/**
 * Turns a Zod schema into an Express middleware.
 *
 * The schema describes the request shape, e.g.
 *   z.object({ body: z.object({...}), params: ..., query: ... })
 *
 * On success the parsed body replaces the raw one, so controllers always
 * receive clean data - trimmed strings, real Date objects, and unknown keys
 * rejected by `.strict()`. Params are validated but left alone (they are plain
 * strings and Express owns that object). The parsed query is exposed on
 * `req.validatedQuery`.
 */
export function validate(schema: ZodTypeAny): RequestHandler {
    return (req, _res, next) => {
        const result = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query,
        });

        if (!result.success) {
            next(new ApiError(400, "Validation failed", formatIssues(result.error)));
            return;
        }

        const parsed = result.data as ParsedRequest;

        if (parsed.body !== undefined) req.body = parsed.body;
        if (parsed.query !== undefined) req.validatedQuery = parsed.query;

        next();
    };
}
