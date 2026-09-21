import * as appointmentService from "../services/appointment.service";
import asyncHandler from "../utils/asyncHandler";

import type { AppointmentQueryFilters } from "../repositories/appointment.repository";
import type {
    CreateAppointmentBody,
    RescheduleAppointmentBody,
    UpdateStatusBody,
} from "../validations/appointment.validation";

export const createAppointment = asyncHandler(async (req, res) => {
    const appointment = await appointmentService.createAppointment(
        req.body as CreateAppointmentBody
    );

    res.status(201).json({
        success: true,
        message: "Appointment created successfully",
        data: appointment,
    });
});

export const getAppointments = asyncHandler(async (req, res) => {
    const filters = (req.validatedQuery ?? {}) as AppointmentQueryFilters;

    const appointments = await appointmentService.getAppointments(filters);

    res.status(200).json({
        success: true,
        count: appointments.length,
        data: appointments,
    });
});

export const getAppointmentById = asyncHandler(async (req, res) => {
    const appointment = await appointmentService.getAppointmentById(req.params.id);

    res.status(200).json({ success: true, data: appointment });
});

export const rescheduleAppointment = asyncHandler(async (req, res) => {
    const appointment = await appointmentService.rescheduleAppointment(
        req.params.id,
        req.body as RescheduleAppointmentBody
    );

    res.status(200).json({
        success: true,
        message: "Appointment rescheduled successfully",
        data: appointment,
    });
});

export const updateAppointmentStatus = asyncHandler(async (req, res) => {
    const { status } = req.body as UpdateStatusBody;

    const appointment = await appointmentService.updateAppointmentStatus(req.params.id, status);

    res.status(200).json({
        success: true,
        message: `Appointment marked as ${status}`,
        data: appointment,
    });
});

export const deleteAppointment = asyncHandler(async (req, res) => {
    await appointmentService.deleteAppointment(req.params.id);

    res.status(200).json({
        success: true,
        message: "Appointment deleted successfully",
    });
});
