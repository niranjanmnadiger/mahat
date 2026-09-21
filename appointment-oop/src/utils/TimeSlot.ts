/**
 * A booking window, as a value object.
 *
 * Three ideas worth defending on their own:
 *
 * 1. The constructor is private. A slot can only be built through
 *    `TimeSlot.fromStart(start, durationMinutes)`, so an end time can never
 *    come from outside - it is always derived from the service's duration.
 *    That single decision removes a whole class of bug where a caller books a
 *    30 minute service and sends an endTime three hours later.
 *
 * 2. Every field is `readonly`. Rescheduling produces a NEW slot rather than
 *    mutating one, so nothing can change a booking's window behind your back.
 *
 * 3. No Mongoose, no Express, no database. Pure date arithmetic, so the
 *    overlap rule - the most important rule in the system - can be tested in
 *    milliseconds with no infrastructure.
 */
export class TimeSlot {
    public static readonly MS_PER_MINUTE = 60_000;

    public readonly startTime: Date;
    public readonly endTime: Date;
    public readonly durationMinutes: number;

    private constructor(startTime: Date, endTime: Date, durationMinutes: number) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.durationMinutes = durationMinutes;
    }

    /**
     * The only way to build a slot. Copies the incoming Date so a caller
     * holding a reference cannot mutate the slot after the fact.
     */
    public static fromStart(startTime: Date, durationMinutes: number): TimeSlot {
        if (Number.isNaN(startTime.getTime())) {
            throw new Error("TimeSlot.fromStart received an invalid Date");
        }
        if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
            throw new Error(`TimeSlot.fromStart needs a positive duration, received ${durationMinutes}`);
        }

        const start = new Date(startTime.getTime());
        const end = new Date(start.getTime() + durationMinutes * TimeSlot.MS_PER_MINUTE);

        return new TimeSlot(start, end, durationMinutes);
    }

    /** Rebuilds an existing stored window, e.g. when loading an appointment. */
    public static fromRange(startTime: Date, endTime: Date): TimeSlot {
        const minutes = (endTime.getTime() - startTime.getTime()) / TimeSlot.MS_PER_MINUTE;
        return TimeSlot.fromStart(startTime, minutes);
    }

    /**
     * Half-open interval test: [start, end) against [start, end).
     *
     * Both comparisons are strict, which is what makes back-to-back bookings
     * legal and overlapping ones illegal:
     *
     *   10:00-10:30 vs 10:30-11:00  -> false (allowed, they only touch)
     *   10:00-10:30 vs 10:15-10:45  -> true  (partial overlap)
     *   10:00-11:00 vs 10:15-10:30  -> true  (fully contained)
     */
    public overlaps(other: TimeSlot): boolean {
        return this.startTime.getTime() < other.endTime.getTime()
            && this.endTime.getTime() > other.startTime.getTime();
    }

    public startsBefore(moment: Date): boolean {
        return this.startTime.getTime() < moment.getTime();
    }

    public toString(): string {
        return `${this.startTime.toISOString()} - ${this.endTime.toISOString()} (${this.durationMinutes} min)`;
    }
}
