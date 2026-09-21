import type { ErrorRequestHandler, RequestHandler } from "express";

import ApiError from "../utils/ApiError";
import { formatIssues } from "./validate";

const CLASH_INDEX = "uniq_provider_start_when_booked";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
    next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Single place where every error becomes an HTTP response.
 * Controllers just call next(error) - no repeated try/catch blocks.
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    // Malformed JSON body - thrown by express.json()
    if (error?.type === "entity.parse.failed" || error instanceof SyntaxError) {
        res.status(400).json({
            success: false,
            message: "Request body is not valid JSON",
        });
        return;
    }

    // Zod error that escaped the validate middleware
    if (error?.name === "ZodError") {
        res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: formatIssues(error),
        });
        return;
    }

    // Mongoose schema validation
    if (error?.name === "ValidationError" && error.errors) {
        res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: Object.values(error.errors).map((e: any) => ({
                field: e.path,
                message: e.message,
            })),
        });
        return;
    }

    // Bad ObjectId that reached the database layer
    if (error?.name === "CastError") {
        res.status(400).json({
            success: false,
            message: `Invalid value for '${error.path}'`,
        });
        return;
    }

    // Unique index violation
    if (error?.code === 11000) {
        // The partial unique index is the last line of defence against two
        // requests racing for the same provider + start time.
        if (String(error.message ?? "").includes(CLASH_INDEX)) {
            res.status(409).json({
                success: false,
                message: "Provider is already booked during this time slot",
            });
            return;
        }

        const field = Object.keys(error.keyValue ?? {})[0] ?? "field";
        res.status(409).json({
            success: false,
            message: `A record with this ${field} already exists`,
        });
        return;
    }

    if (error instanceof ApiError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
            ...(error.details !== undefined ? { errors: error.details } : {}),
        });
        return;
    }

    // Anything unexpected - log it, do not leak internals to the client.
    console.error("Unhandled error:", error);

    res.status(500).json({
        success: false,
        message: "Something went wrong",
    });
};
