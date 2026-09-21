const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
        },

        providerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Provider",
            required: true,
        },

        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true,
        },

        appointmentDate: {
            type: Date,
            required: true,
        },

        status: {
            type: String,
            enum: ["booked", "completed", "cancelled"],
            default: "booked",
        },
    },
    {
        timestamps: true,
    }
);

const Appointment = mongoose.model(
    "Appointment",
    appointmentSchema
);

module.exports = Appointment;