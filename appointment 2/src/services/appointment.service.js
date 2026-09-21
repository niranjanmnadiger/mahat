const appointmentRepository = require("../repositories/appointment.repository");
const customerRepository = require("../repositories/customer.repository");
const providerRepository = require("../repositories/provider.repository");
const serviceRepository = require("../repositories/service.repository");

const ApiError = require("../utils/ApiError");
const { resolveSlot } = require("../utils/time");

/**
 * Formats a conflicting appointment for the 409 response body so the caller
 * can see exactly which booking is in the way.
 */
function describeConflict(appointment) {
    return {
        appointmentId: appointment._id,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        customer: appointment.customerId?.name,
        provider: appointment.providerId?.name,
        service: appointment.serviceId?.name,
    };
}

/**
 * Loads and cross-checks the three referenced entities.
 */
async function loadEntities({ customerId, providerId, serviceId }) {
    const [customer, provider, service] = await Promise.all([
        customerRepository.findById(customerId),
        providerRepository.findById(providerId),
        serviceRepository.findById(serviceId),
    ]);

    if (!customer) throw new ApiError(404, "Customer not found");
    if (!provider) throw new ApiError(404, "Provider not found");
    if (!service) throw new ApiError(404, "Service not found");

    if (service.providerId.toString() !== providerId.toString()) {
        throw new ApiError(
            400,
            "This service does not belong to the selected provider"
        );
    }

    return { customer, provider, service };
}

/**
 * Builds the slot and validates it is sane and in the future.
 */
function buildSlot({ startTime, endTime, service }) {
    const slot = resolveSlot(startTime, endTime, service.durationMinutes);

    if (slot.endTime.getTime() <= slot.startTime.getTime()) {
        throw new ApiError(400, "endTime must be after startTime");
    }

    if (slot.startTime.getTime() < Date.now()) {
        throw new ApiError(400, "Cannot book an appointment in the past");
    }

    return slot;
}

/**
 * The double-booking guard.
 *
 * 1. The provider must not already be committed to someone else in this window.
 * 2. The customer must not already be booked elsewhere in this window.
 *
 * `excludeId` is passed when rescheduling so an appointment does not conflict
 * with its own current slot.
 */
async function assertNoConflicts({
    providerId,
    customerId,
    startTime,
    endTime,
    excludeId,
}) {
    const [providerConflict, customerConflict] = await Promise.all([
        appointmentRepository.findOverlappingForProvider(
            providerId,
            startTime,
            endTime,
            excludeId
        ),
        appointmentRepository.findOverlappingForCustomer(
            customerId,
            startTime,
            endTime,
            excludeId
        ),
    ]);

    if (providerConflict) {
        throw new ApiError(
            409,
            "Provider is already booked during this time slot",
            { conflictsWith: describeConflict(providerConflict) }
        );
    }

    if (customerConflict) {
        throw new ApiError(
            409,
            "Customer already has another appointment during this time slot",
            { conflictsWith: describeConflict(customerConflict) }
        );
    }
}

async function createAppointment(data) {
    const { customerId, providerId, serviceId, startTime, endTime, notes } = data;

    const { service } = await loadEntities({ customerId, providerId, serviceId });

    const slot = buildSlot({ startTime, endTime, service });

    await assertNoConflicts({
        providerId,
        customerId,
        startTime: slot.startTime,
        endTime: slot.endTime,
    });

    const created = await appointmentRepository.create({
        customerId,
        providerId,
        serviceId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        durationMinutes: slot.durationMinutes,
        notes,
    });

    return appointmentRepository.findByIdPopulated(created._id);
}

function getAppointments(filters) {
    return appointmentRepository.findAll(filters);
}

async function getAppointmentById(id) {
    const appointment = await appointmentRepository.findByIdPopulated(id);

    if (!appointment) throw new ApiError(404, "Appointment not found");

    return appointment;
}

/**
 * Moves an existing appointment to a new slot, re-running the same conflict
 * checks while ignoring the appointment's own current booking.
 */
async function rescheduleAppointment(id, { startTime, endTime }) {
    const appointment = await appointmentRepository.findById(id);

    if (!appointment) throw new ApiError(404, "Appointment not found");

    if (appointment.status !== "booked") {
        throw new ApiError(
            400,
            `Only a booked appointment can be rescheduled (current status: ${appointment.status})`
        );
    }

    const service = await serviceRepository.findById(appointment.serviceId);

    if (!service) throw new ApiError(404, "Service not found");

    const slot = buildSlot({ startTime, endTime, service });

    await assertNoConflicts({
        providerId: appointment.providerId,
        customerId: appointment.customerId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        excludeId: appointment._id,
    });

    return appointmentRepository.updateById(id, {
        startTime: slot.startTime,
        endTime: slot.endTime,
        durationMinutes: slot.durationMinutes,
    });
}

const ALLOWED_TRANSITIONS = {
    booked: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
};

async function updateAppointmentStatus(id, status) {
    const appointment = await appointmentRepository.findById(id);

    if (!appointment) throw new ApiError(404, "Appointment not found");

    if (appointment.status === status) {
        throw new ApiError(400, `Appointment is already ${status}`);
    }

    const allowed = ALLOWED_TRANSITIONS[appointment.status] || [];

    if (!allowed.includes(status)) {
        throw new ApiError(
            400,
            `Cannot change status from ${appointment.status} to ${status}`
        );
    }

    return appointmentRepository.updateById(id, { status });
}

async function deleteAppointment(id) {
    const appointment = await appointmentRepository.deleteById(id);

    if (!appointment) throw new ApiError(404, "Appointment not found");

    return appointment;
}

module.exports = {
    createAppointment,
    getAppointments,
    getAppointmentById,
    rescheduleAppointment,
    updateAppointmentStatus,
    deleteAppointment,
};
