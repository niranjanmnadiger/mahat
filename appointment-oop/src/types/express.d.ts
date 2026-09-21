/**
 * Adds `req.validated` to Express's Request type.
 *
 * The validation middleware parses body/query/params with Zod and puts the
 * PARSED result here. Controllers read `req.validated`, never `req.body`, so
 * they always work with coerced, trimmed, type-safe data.
 */
declare global {
    namespace Express {
        interface Request {
            validated?: {
                body?: unknown;
                query?: unknown;
                params?: unknown;
            };
        }
    }
}

export {};
