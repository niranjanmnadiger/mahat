/**
 * Pure time-slot helpers. No database, no framework - so they are easy to unit test.
 */

export const MS_PER_MINUTE = 60 * 1000;

export interface Slot {
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
}

/**
 * Half-open interval overlap test: [aStart, aEnd) vs [bStart, bEnd).
 *
 * Two slots overlap when each one starts before the other ends.
 * Because the comparison is strict, back-to-back bookings do NOT collide:
 *   10:00-10:30 and 10:30-11:00  -> no overlap (allowed)
 *   10:00-10:30 and 10:15-10:45  -> overlap    (rejected)
 *   10:00-11:00 and 10:15-10:30  -> overlap    (fully contained, rejected)
 */
export function isOverlapping(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
    return aStart.getTime() < bEnd.getTime() && aEnd.getTime() > bStart.getTime();
}

export function addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * MS_PER_MINUTE);
}

/**
 * Builds the booking window from the customer's chosen start time.
 *
 * The caller only picks WHEN they arrive. How long they stay is fixed by the
 * service they booked, so endTime is always derived and never accepted from
 * the request - a 30 minute consultation is 30 minutes whoever books it.
 */
export function resolveSlot(startTime: Date, serviceDurationMinutes: number): Slot {
    const start = new Date(startTime.getTime());

    return {
        startTime: start,
        endTime: addMinutes(start, serviceDurationMinutes),
        durationMinutes: serviceDurationMinutes,
    };
}
