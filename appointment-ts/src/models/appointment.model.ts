import { Schema, model, Types, type HydratedDocument } from "mongoose";

export const APPOINTMENT_STATUSES = ["booked", "completed", "cancelled"] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/**
 * An appointment occupies a half-open time slot: [startTime, endTime).
 *
 * The customer picks startTime. endTime is always derived from the booked
 * service's durationMinutes - it is never accepted from the request.
 */
export interface IAppointment {
    customerId: Types.ObjectId;
    providerId: Types.ObjectId;
    serviceId: Types.ObjectId;
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    status: AppointmentStatus;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export type AppointmentDocument = HydratedDocument<IAppointment>;

/** Shape of a ref once `.populate()` has replaced the ObjectId. */
export interface PopulatedRef {
    _id: Types.ObjectId;
    name?: string;
    [key: string]: unknown;
}

/** What the repository returns for the populated read paths. */
export type PopulatedAppointment = Omit<
    IAppointment,
    "customerId" | "providerId" | "serviceId"
> & {
    _id: Types.ObjectId;
    customerId: PopulatedRef | null;
    providerId: PopulatedRef | null;
    serviceId: PopulatedRef | null;
};

const appointmentSchema = new Schema<IAppointment>(
    {
        customerId: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
            index: true,
        },

        providerId: {
            type: Schema.Types.ObjectId,
            ref: "Provider",
            required: true,
            index: true,
        },

        serviceId: {
            type: Schema.Types.ObjectId,
            ref: "Service",
            required: true,
            index: true,
        },

        startTime: {
            type: Date,
            required: true,
        },

        endTime: {
            type: Date,
            required: true,
            validate: {
                validator: function (this: IAppointment, value: Date): boolean {
                    // `this` is not the document on some update paths, so guard.
                    if (!this || !this.startTime) return true;
                    return value.getTime() > this.startTime.getTime();
                },
                message: "endTime must be after startTime",
            },
        },

        // Snapshot of the slot length so historical records stay accurate even
        // if the service duration is edited later.
        durationMinutes: {
            type: Number,
            required: true,
            min: 1,
        },

        status: {
            type: String,
            enum: [...APPOINTMENT_STATUSES],
            default: "booked",
            index: true,
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 500,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes that back the overlap queries. Without these every booking
// attempt would collection-scan to find conflicts.
appointmentSchema.index({ providerId: 1, startTime: 1, endTime: 1 });
appointmentSchema.index({ customerId: 1, startTime: 1, endTime: 1 });

/**
 * Database-level guarantee for the most common clash: two people grabbing the
 * exact same start time with the same provider. The application check below is
 * read-then-write, so under real concurrency both requests can pass it. This
 * partial unique index makes the loser fail at insert time with a duplicate key
 * error, which the error middleware turns into a 409.
 *
 * Only `booked` rows are indexed, so cancelling really does free the slot.
 */
appointmentSchema.index(
    { providerId: 1, startTime: 1 },
    {
        unique: true,
        partialFilterExpression: { status: "booked" },
        name: "uniq_provider_start_when_booked",
    }
);

export const Appointment = model<IAppointment>("Appointment", appointmentSchema);

export default Appointment;
