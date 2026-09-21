/**
 * Application level error carrying an HTTP status code.
 * Thrown by the service layer, translated to a response by the error middleware.
 */
class ApiError extends Error {
    constructor(statusCode, message, details) {
        super(message);
        this.name = "ApiError";
        this.statusCode = statusCode;
        if (details) this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = ApiError;
