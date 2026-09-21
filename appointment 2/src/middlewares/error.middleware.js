const ApiError = require("../utils/ApiError");
const { formatIssues } = require("./validate");

function notFoundHandler(req, res, next) {
    next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Single place where every error becomes an HTTP response.
 * Controllers just call next(error) - no repeated try/catch blocks.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, next) {
    // Malformed JSON body - thrown by express.json()
    if (error.type === "entity.parse.failed" || error instanceof SyntaxError) {
        return res.status(400).json({
            success: false,
            message: "Request body is not valid JSON",
        });
    }

    // Zod error that escaped the validate middleware
    if (error.name === "ZodError") {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: formatIssues(error),
        });
    }

    // Mongoose schema validation
    if (error.name === "ValidationError") {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: Object.values(error.errors).map((e) => ({
                field: e.path,
                message: e.message,
            })),
        });
    }

    // Bad ObjectId that reached the database layer
    if (error.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: `Invalid value for '${error.path}'`,
        });
    }

    // Unique index violation
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue || {})[0] || "field";
        return res.status(409).json({
            success: false,
            message: `A record with this ${field} already exists`,
        });
    }

    if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
            ...(error.details ? { errors: error.details } : {}),
        });
    }

    // Anything unexpected - log it, do not leak internals to the client.
    console.error("Unhandled error:", error);

    return res.status(error.statusCode || 500).json({
        success: false,
        message: "Something went wrong",
    });
}

module.exports = { notFoundHandler, errorHandler };
