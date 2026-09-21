import * as appointmentRepository from "../repositories/appointment.repository";
import * as customerRepository from "../repositories/customer.repository";
import * as providerRepository from "../repositories/provider.repository";
import * as serviceRepository from "../repositories/service.repository";

import type { AppointmentQueryFilters } from "../repositories/appointment.repository";
import type { Id } from "../repositories/types";
import type {
    AppointmentDocument,
    AppointmentStatus,
    PopulatedAppointment,
} from "../models/appointment.model";
import type { ServiceDocument } from "../models/service.model";

import ApiError from "../utils/ApiError";
import { resolveSlot, type Slot } from "../utils/time";

export interface CreateAppointmentInput {
    customerId: string;
    providerId: string;
    serviceId: string;
    startTime: Date;
    notes?: string;
}

export interface RescheduleInput {
    startTime: Date;
}

interface ConflictSummary {
    appointmentId: unknown;
    startTime: Date;
    endTime: Date;
    status: AppointmentStatus;
    customer?: unknown;
    provider?: unknown;
    service?: unknown;
}

/**
 * Formats a conflicting appointment for the 409 response body so the caller
 * can see exactly which booking is in the way.
 */
function describeConflict(appointment: PopulatedAppointment): ConflictSummary {
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
async function loadService(ids: {
    customerId: string;
    providerId: string;
    serviceId: string;
}): Promise<ServiceDocument> {
    const [customer, provider, service] = await Promise.all([
        customerRepository.findById(ids.customerId),
        providerRepository.findById(ids.providerId),
        serviceRepository.findById(ids.serviceId),
    ]);

    if (!customer) throw new ApiError(404, "Customer not found");
    if (!provider) throw new ApiError(404, "Provider not found");
    if (!service) throw new ApiError(404, "Service not found");

    if (service.providerId.toString() !== ids.providerId.toString()) {
        throw new ApiError(400, "This service does not belong to the selected provider");
    }

    return service;
}

/**
 * Builds the slot from the customer's chosen start time and checks it is sane.
 * The length always comes from the service, never from the request.
 */
function buildSlot(startTime: Date, service: ServiceDocument): Slot {
    const slot = resolveSlot(startTime, service.durationMinutes);

    if (slot.startTime.getTime() < Date.now()) {
        throw new ApiError(400, "Cannot book an appointment in the past");
    }

    return slot;
}

/**
 * The clash guard.
 *
 * 1. The provider must not already be committed to someone else in this window
 *    - across ANY of their services, not just the one being booked.
 * 2. The customer must not already be booked elsewhere in this window.
 *
 * `excludeId` is passed when rescheduling so an appointment does not conflict
 * with its own current slot.
 */
async function assertNoConflicts(params: {
    providerId: Id;
    customerId: Id;
    startTime: Date;
    endTime: Date;
    excludeId?: Id;
}): Promise<void> {
    const { providerId, customerId, startTime, endTime, excludeId } = params;

    const [providerConflict, customerConflict] = await Promise.all([
        appointmentRepository.findOverlappingForProvider(providerId, startTime, endTime, excludeId),
        appointmentRepository.findOverlappingForCustomer(customerId, startTime, endTime, excludeId),
    ]);

    if (providerConflict) {
        throw new ApiError(409, "Provider is already booked during this time slot", {
            conflictsWith: describeConflict(providerConflict),
        });
    }

    if (customerConflict) {
        throw new ApiError(409, "Customer already has another appointment during this time slot", {
            conflictsWith: describeConflict(customerConflict),
        });
    }
}

export async function createAppointment(
    data: CreateAppointmentInput
): Promise<PopulatedAppointment | null> {
    const { customerId, providerId, serviceId, startTime, notes } = data;

    const service = await loadService({ customerId, providerId, serviceId });

    const slot = buildSlot(startTime, service);

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

export function getAppointments(
    filters: AppointmentQueryFilters
): Promise<PopulatedAppointment[]> {
    return appointmentRepository.findAll(filters);
}

export async function getAppointmentById(id: string): Promise<PopulatedAppointment> {
    const appointment = await appointmentRepository.findByIdPopulated(id);

    if (!appointment) throw new ApiError(404, "Appointment not found");

    return appointment;
}

/**
 * Moves an existing appointment to a new start time, re-running the same clash
 * checks while ignoring the appointment's own current booking.
 */
export async function rescheduleAppointment(
    id: string,
    { startTime }: RescheduleInput
): Promise<PopulatedAppointment | null> {
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

    const slot = buildSlot(startTime, service);

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

const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
    booked: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
};

export async function updateAppointmentStatus(
    id: string,
    status: AppointmentStatus
): Promise<PopulatedAppointment | null> {
    const appointment = await appointmentRepository.findById(id);

    if (!appointment) throw new ApiError(404, "Appointment not found");

    if (appointment.status === status) {
        throw new ApiError(400, `Appointment is already ${status}`);
    }

    const allowed = ALLOWED_TRANSITIONS[appointment.status] ?? [];

    if (!allowed.includes(status)) {
        throw new ApiError(400, `Cannot change status from ${appointment.status} to ${status}`);
    }

    return appointmentRepository.updateById(id, { status });
}

export async function deleteAppointment(id: string): Promise<AppointmentDocument> {
    const appointment = await appointmentRepository.deleteById(id);

    if (!appointment) throw new ApiError(404, "Appointment not found");

    return appointment;
}
