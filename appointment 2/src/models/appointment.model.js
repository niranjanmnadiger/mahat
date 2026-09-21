const mongoose = require("mongoose");

/**
 * An appointment occupies a time slot: [startTime, endTime).
 *
 * startTime is supplied by the caller. endTime is either supplied explicitly or
 * derived from the service duration in the service layer, so an appointment
 * always knows when the customer arrives and when they leave.
 */
const appointmentSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
            index: true,
        },

        providerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Provider",
            required: true,
            index: true,
        },

        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true,
        },

        startTime: {
            type: Date,
            required: true,
        },

        endTime: {
            type: Date,
            required: true,
            validate: {
                validator: function (value) {
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
            enum: ["booked", "completed", "cancelled"],
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

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
