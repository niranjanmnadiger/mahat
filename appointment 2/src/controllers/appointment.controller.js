const appointmentService = require("../services/appointment.service");
const asyncHandler = require("../utils/asyncHandler");

const createAppointment = asyncHandler(async (req, res) => {
    const appointment = await appointmentService.createAppointment(req.body);

    return res.status(201).json({
        success: true,
        message: "Appointment created successfully",
        data: appointment,
    });
});

const getAppointments = asyncHandler(async (req, res) => {
    const appointments = await appointmentService.getAppointments(
        req.validatedQuery || {}
    );

    return res.status(200).json({
        success: true,
        count: appointments.length,
        data: appointments,
    });
});

const getAppointmentById = asyncHandler(async (req, res) => {
    const appointment = await appointmentService.getAppointmentById(
        req.params.id
    );

    return res.status(200).json({ success: true, data: appointment });
});

const rescheduleAppointment = asyncHandler(async (req, res) => {
    const appointment = await appointmentService.rescheduleAppointment(
        req.params.id,
        req.body
    );

    return res.status(200).json({
        success: true,
        message: "Appointment rescheduled successfully",
        data: appointment,
    });
});

const updateAppointmentStatus = asyncHandler(async (req, res) => {
    const appointment = await appointmentService.updateAppointmentStatus(
        req.params.id,
        req.body.status
    );

    return res.status(200).json({
        success: true,
        message: `Appointment marked as ${req.body.status}`,
        data: appointment,
    });
});

const deleteAppointment = asyncHandler(async (req, res) => {
    await appointmentService.deleteAppointment(req.params.id);

    return res.status(200).json({
        success: true,
        message: "Appointment deleted successfully",
    });
});

module.exports = {
    createAppointment,
    getAppointments,
    getAppointmentById,
    rescheduleAppointment,
    updateAppointmentStatus,
    deleteAppointment,
};
