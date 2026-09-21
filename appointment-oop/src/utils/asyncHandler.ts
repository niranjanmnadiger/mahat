import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Express 4 does not catch a rejected promise from an async handler: the
 * request hangs and the error never reaches the error middleware. Wrapping
 * every controller method in this forwards the rejection to `next()`, which
 * is what lets controllers be three lines with no try/catch.
 */
export function asyncHandler(
    handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
}
