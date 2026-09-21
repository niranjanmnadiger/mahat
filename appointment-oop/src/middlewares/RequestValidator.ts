import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError, type ZodTypeAny } from "zod";

interface Schemas {
    body?: ZodTypeAny;
    query?: ZodTypeAny;
    params?: ZodTypeAny;
}

/**
 * Turns a set of Zod schemas into an Express middleware.
 *
 * `validate` is `static`, so there is nothing to instantiate - the class is
 * just a namespace holding related functions. Call it as
 * `RequestValidator.validate({ body: createCustomerBody })`.
 *
 * The parsed result is attached to `req.validated`, never written back over
 * `req.body`. Controllers read the validated copy, so a controller can never
 * accidentally use raw, unchecked input.
 */
export class RequestValidator {
    public static validate(schemas: Schemas): RequestHandler {
        return (req: Request, _res: Response, next: NextFunction): void => {
            try {
                const validated: NonNullable<Request["validated"]> = {};

                if (schemas.body) validated.body = schemas.body.parse(req.body);
                if (schemas.query) validated.query = schemas.query.parse(req.query);
                if (schemas.params) validated.params = schemas.params.parse(req.params);

                req.validated = validated;
                next();
            } catch (error) {
                // Handed to the error middleware, which owns every response shape.
                next(error);
            }
        };
    }

    /** Flattens a ZodError into [{ field, message }] for the response body. */
    public static formatIssues(error: ZodError): Array<{ field: string; message: string }> {
        return error.issues.map((issue) => ({
            field: issue.path.join(".") || "body",
            message: issue.message,
        }));
    }
}
