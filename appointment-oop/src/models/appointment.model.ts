import { Schema, model, type Document, type Types } from "mongoose";
import { APPOINTMENT_STATUSES, type AppointmentStatus } from "../types/common";
import type { CustomerDocument } from "./customer.model";
import type { ProviderDocument } from "./provider.model";
import type { ServiceDocument } from "./service.model";

export interface AppointmentAttrs {
    customerId: Types.ObjectId;
    providerId: Types.ObjectId;
    serviceId: Types.ObjectId;
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    status: AppointmentStatus;
    notes?: string;
}

export interface AppointmentDocument extends AppointmentAttrs, Document {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

/** What `.populate()` turns the three refs into when reading. */
export interface PopulatedAppointment extends Omit<AppointmentDocument, "customerId" | "providerId" | "serviceId"> {
    customerId: CustomerDocument;
    providerId: ProviderDocument;
    serviceId: ServiceDocument;
}

/** The unique index name, referenced by the error handler when Mongo rejects a race. */
export const CLASH_INDEX = "uniq_provider_start_when_booked";

const appointmentSchema = new Schema<AppointmentDocument>(
    {
        customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
        providerId: { type: Schema.Types.ObjectId, ref: "Provider", required: true },
        serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },

        startTime: { type: Date, required: true },
        // Never accepted from a request. The service derives it from the
        // service's durationMinutes via TimeSlot and writes it here.
        endTime: { type: Date, required: true },

        // Copied at booking time on purpose. If someone edits the service from
        // 30 to 45 minutes next month, past appointments keep the 30 they were
        // actually booked for. Deriving it at read time would rewrite history.
        durationMinutes: { type: Number, required: true, min: 5 },

        status: { type: String, enum: APPOINTMENT_STATUSES, default: "booked", required: true },
        notes: { type: String, trim: true, maxlength: 500 },
    },
    { timestamps: true }
);

// The two overlap queries in AppointmentRepository read straight off these.
appointmentSchema.index({ providerId: 1, startTime: 1, endTime: 1 });
appointmentSchema.index({ customerId: 1, startTime: 1, endTime: 1 });

// Last line of defence against two requests racing for the same slot.
// The application check can pass for both before either writes; this index
// makes the database reject the second one. `partialFilterExpression` is what
// lets a cancelled booking free the slot for a new one.
appointmentSchema.index(
    { providerId: 1, startTime: 1 },
    {
        unique: true,
        name: CLASH_INDEX,
        partialFilterExpression: { status: "booked" },
    }
);

export const Appointment = model<AppointmentDocument>("Appointment", appointmentSchema);
