/**
 * Application level error carrying an HTTP status code.
 * Thrown by the service layer, translated to a response by the error middleware.
 */
export type ErrorDetails = unknown;

export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly details?: ErrorDetails;

    constructor(statusCode: number, message: string, details?: ErrorDetails) {
        super(message);
        this.name = "ApiError";
        this.statusCode = statusCode;
        if (details !== undefined) this.details = details;
        Error.captureStackTrace(this, ApiError);
    }
}

export default ApiError;
