/**
 * Pure time-slot helpers. No database, no framework - so they are easy to unit test.
 */

const MS_PER_MINUTE = 60 * 1000;

/**
 * Half-open interval overlap test: [aStart, aEnd) vs [bStart, bEnd).
 *
 * Two slots overlap when each one starts before the other ends.
 * Because the comparison is strict, back-to-back bookings do NOT collide:
 *   10:00-10:30 and 10:30-11:00  -> no overlap (allowed)
 *   10:00-10:30 and 10:15-10:45  -> overlap    (rejected)
 *   10:00-11:00 and 10:15-10:30  -> overlap    (fully contained, rejected)
 */
function isOverlapping(aStart, aEnd, bStart, bEnd) {
    return aStart.getTime() < bEnd.getTime() && aEnd.getTime() > bStart.getTime();
}

function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * MS_PER_MINUTE);
}

function diffInMinutes(start, end) {
    return (end.getTime() - start.getTime()) / MS_PER_MINUTE;
}

function isValidDate(value) {
    return value instanceof Date && !Number.isNaN(value.getTime());
}

/**
 * Resolves the booking window.
 * endTime is optional on the request - when it is absent we derive it from the
 * service duration, so the caller only has to say when they will arrive.
 */
function resolveSlot(startTime, endTime, serviceDurationMinutes) {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : addMinutes(start, serviceDurationMinutes);

    return {
        startTime: start,
        endTime: end,
        durationMinutes: diffInMinutes(start, end),
    };
}

module.exports = {
    MS_PER_MINUTE,
    isOverlapping,
    addMinutes,
    diffInMinutes,
    isValidDate,
    resolveSlot,
};
