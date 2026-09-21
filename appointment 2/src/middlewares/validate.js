const ApiError = require("../utils/ApiError");

/**
 * Turns a Zod schema into an Express middleware.
 *
 * The schema is expected to describe the request shape, e.g.
 *   z.object({ body: z.object({...}), params: ..., query: ... })
 *
 * On success the parsed (trimmed, coerced) values replace the raw ones, so
 * controllers always receive clean data - dates are real Date objects, strings
 * are trimmed, and unknown keys have been stripped or rejected.
 */
function validate(schema) {
    return function (req, res, next) {
        const result = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query,
        });

        if (!result.success) {
            return next(
                new ApiError(400, "Validation failed", formatIssues(result.error))
            );
        }

        if (result.data.body) req.body = result.data.body;
        if (result.data.params) req.params = result.data.params;

        // req.query is read-only on newer Express versions, so the parsed
        // version is exposed separately.
        if (result.data.query) req.validatedQuery = result.data.query;

        return next();
    };
}

/**
 * Flattens Zod issues into a compact, client-friendly array.
 * `body.startTime` reads better than a nested tree.
 */
function formatIssues(error) {
    return error.issues.map((issue) => ({
        field: issue.path.join(".") || "(root)",
        message: issue.message,
    }));
}

module.exports = { validate, formatIssues };
