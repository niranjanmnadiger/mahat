/**
 * Wraps an async route handler so rejected promises are forwarded
 * to the central error middleware instead of crashing the process.
 */
function asyncHandler(handler) {
    return function (req, res, next) {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
}

module.exports = asyncHandler;
