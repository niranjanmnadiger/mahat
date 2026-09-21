/**
 * `req.query` is a getter on Express 5 and is re-derived per request on
 * Express 4, so the parsed/coerced query object is exposed separately instead
 * of being written back over the original.
 */
declare global {
    namespace Express {
        interface Request {
            validatedQuery?: Record<string, unknown>;
        }
    }
}

export {};
