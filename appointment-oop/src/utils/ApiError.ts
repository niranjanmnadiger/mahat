/**
 * An error that already knows which HTTP status it deserves.
 *
 * The service layer throws these; the ErrorHandler middleware is the only
 * place that turns them into a response. That split is what keeps services
 * free of `res` - a service can be called from a script, a queue worker or a
 * test without Express being involved.
 *
 * The named static factories (`notFound`, `conflict`, ...) exist so no caller
 * has to remember that "not found" is 404. Read a service and you see intent,
 * not numbers.
 */
export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly details?: unknown;

    public constructor(statusCode: number, message: string, details?: unknown) {
        super(message);

        // Subclassing a built-in: without this the prototype chain is broken
        // when the code is compiled down, and `err instanceof ApiError` is false.
        Object.setPrototypeOf(this, new.target.prototype);

        this.name = "ApiError";
        this.statusCode = statusCode;
        if (details !== undefined) this.details = details;

        Error.captureStackTrace(this, ApiError);
    }

    public static badRequest(message: string, details?: unknown): ApiError {
        return new ApiError(400, message, details);
    }

    public static notFound(message: string): ApiError {
        return new ApiError(404, message);
    }

    public static conflict(message: string, details?: unknown): ApiError {
        return new ApiError(409, message, details);
    }

    /** Shape sent to the client. `errors` is omitted when there are no details. */
    public toResponse(): { success: false; message: string; errors?: unknown } {
        return {
            success: false,
            message: this.message,
            ...(this.details !== undefined ? { errors: this.details } : {}),
        };
    }
}
