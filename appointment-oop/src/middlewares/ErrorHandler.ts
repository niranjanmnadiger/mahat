import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError } from "zod";
import { CLASH_INDEX } from "../models/appointment.model";
import { ApiError } from "../utils/ApiError";
import { RequestValidator } from "./RequestValidator";

/**
 * The single place that turns a thrown error into an HTTP response.
 *
 * Because this exists, no service or controller ever touches `res` for an
 * error path, and no route needs its own try/catch.
 *
 * `handle` and `notFound` are arrow-function PROPERTIES, not methods. Express
 * is given the function on its own (`app.use(errorHandler.handle)`), which
 * detaches it from the object - with a normal method, `this` would be
 * undefined at call time. Arrow properties capture `this` at construction.
 */
export class ErrorHandler {
    private readonly isProduction: boolean;

    public constructor(isProduction: boolean) {
        this.isProduction = isProduction;
    }

    /** Any URL that matched no route. Registered after all routes. */
    public readonly notFound: RequestHandler = (req, res) => {
        res.status(404).json({
            success: false,
            message: `Route not found: ${req.method} ${req.originalUrl}`,
        });
    };

    public readonly handle: ErrorRequestHandler = (
        error: unknown,
        _req: Request,
        res: Response,
        _next: NextFunction
    ): void => {
        // 1. Malformed JSON, thrown by express.json() before any route runs.
        if (error instanceof SyntaxError && "body" in error) {
            res.status(400).json({ success: false, message: "Request body is not valid JSON" });
            return;
        }

        // 2. Validation failure from RequestValidator.
        if (error instanceof ZodError) {
            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: RequestValidator.formatIssues(error),
            });
            return;
        }

        const anyError = error as { name?: string; code?: number; path?: string; message?: string; keyValue?: Record<string, unknown>; errors?: Record<string, { path: string; message: string }> };

        // 3. A Mongoose schema rule that Zod did not already cover.
        if (anyError?.name === "ValidationError" && anyError.errors) {
            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: Object.values(anyError.errors).map((e) => ({ field: e.path, message: e.message })),
            });
            return;
        }

        // 4. A malformed id that reached the database layer.
        if (anyError?.name === "CastError") {
            res.status(400).json({ success: false, message: `Invalid value for '${anyError.path}'` });
            return;
        }

        // 5. Unique index violation (E11000).
        if (anyError?.code === 11000) {
            // The partial unique index firing means two requests raced for the
            // same provider and start time, and the database rejected the loser.
            if (String(anyError.message ?? "").includes(CLASH_INDEX)) {
                res.status(409).json({
                    success: false,
                    message: "Provider is already booked during this time slot",
                });
                return;
            }

            const field = Object.keys(anyError.keyValue ?? {})[0] ?? "field";
            res.status(409).json({ success: false, message: `A record with this ${field} already exists` });
            return;
        }

        // 6. Anything a service threw deliberately.
        if (error instanceof ApiError) {
            res.status(error.statusCode).json(error.toResponse());
            return;
        }

        // 7. Anything else is a bug. Log it in full, tell the client nothing.
        console.error("[error] unhandled:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong on the server",
            ...(this.isProduction ? {} : { debug: String((error as Error)?.message ?? error) }),
        });
    };
}
