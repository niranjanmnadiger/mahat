import type { PopulatedAppointment } from "../models/appointment.model";
import type { ServiceDocument } from "../models/service.model";
import type { AppointmentFilters, AppointmentRepository } from "../repositories/AppointmentRepository";
import type { CustomerRepository } from "../repositories/CustomerRepository";
import type { ProviderRepository } from "../repositories/ProviderRepository";
import type { ServiceRepository } from "../repositories/ServiceRepository";
import type { AppointmentStatus } from "../types/common";
import { ApiError } from "../utils/ApiError";
import { TimeSlot } from "../utils/TimeSlot";

export interface CreateAppointmentInput {
    customerId: string;
    providerId: string;
    serviceId: string;
    startTime: Date;
    notes?: string;
}

/** The 409 body, so the caller sees exactly which booking is in the way. */
export interface ConflictSummary {
    appointmentId: string;
    startTime: Date;
    endTime: Date;
    status: AppointmentStatus;
    customer: string;
    provider: string;
    service: string;
}

/**
 * Every scheduling rule in the system lives here.
 *
 * The class has four repositories and one public surface. Note which methods
 * are `private`: a caller can reach `create()`, but cannot reach
 * `assertNoClashes()` and skip it. That is stronger encapsulation than
 * anything a comment could enforce.
 */
export class AppointmentService {
    public constructor(
        private readonly appointments: AppointmentRepository,
        private readonly customers: CustomerRepository,
        private readonly providers: ProviderRepository,
        private readonly services: ServiceRepository
    ) {}

    // ---------- private helpers ----------

    /**
     * Loads the three referenced entities and checks they belong together.
     *
     * The provider/service pair matters: a request could name Dr Rao and a
     * physiotherapy service. Without this check the appointment would be
     * written with a duration from a service its provider does not offer.
     */
    private async loadAndValidateRefs(input: {
        customerId: string;
        providerId: string;
        serviceId: string;
    }): Promise<ServiceDocument> {
        const [customer, provider, service] = await Promise.all([
            this.customers.findById(input.customerId),
            this.providers.findById(input.providerId),
            this.services.findById(input.serviceId),
        ]);

        if (!customer) throw ApiError.badRequest("customerId does not match any customer");
        if (!provider) throw ApiError.badRequest("providerId does not match any provider");
        if (!service) throw ApiError.badRequest("serviceId does not match any service");

        if (String(service.providerId) !== input.providerId) {
            throw ApiError.badRequest(
                `${provider.name} does not offer "${service.name}". Pick a service that belongs to this provider.`
            );
        }

        return service;
    }

    private describeClash(appointment: PopulatedAppointment): ConflictSummary {
        return {
            appointmentId: String(appointment._id),
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            status: appointment.status,
            customer: appointment.customerId?.name ?? "Unknown",
            provider: appointment.providerId?.name ?? "Unknown",
            service: appointment.serviceId?.name ?? "Unknown",
        };
    }

    /**
     * The two rules that make this a scheduling system rather than a list:
     *
     * 1. A provider cannot be in two places at once - checked across ALL of
     *    their services, not just the one being booked.
     * 2. A customer cannot be in two places at once either.
     *
     * Both are checked before writing. The unique partial index on the
     * collection covers the narrow race where two requests pass this check
     * at the same instant.
     */
    private async assertNoClashes(params: {
        providerId: string;
        customerId: string;
        slot: TimeSlot;
        excludeId?: string;
    }): Promise<void> {
        const { providerId, customerId, slot, excludeId } = params;

        const [providerClash, customerClash] = await Promise.all([
            this.appointments.findProviderClash(providerId, slot.startTime, slot.endTime, excludeId),
            this.appointments.findCustomerClash(customerId, slot.startTime, slot.endTime, excludeId),
        ]);

        if (providerClash) {
            throw ApiError.conflict("Provider is already booked during this time slot", {
                conflictsWith: this.describeClash(providerClash),
            });
        }

        if (customerClash) {
            throw ApiError.conflict("Customer already has another appointment during this time slot", {
                conflictsWith: this.describeClash(customerClash),
            });
        }
    }

    private assertNotInPast(slot: TimeSlot): void {
        if (slot.startsBefore(new Date())) {
            throw ApiError.badRequest("Start time is in the past. Pick a future time.");
        }
    }

    // ---------- public surface ----------

    public async create(input: CreateAppointmentInput): Promise<PopulatedAppointment> {
        const service = await this.loadAndValidateRefs(input);

        // The caller chooses WHEN. How long it runs comes from the service.
        const slot = TimeSlot.fromStart(input.startTime, service.durationMinutes);

        this.assertNotInPast(slot);
        await this.assertNoClashes({
            providerId: input.providerId,
            customerId: input.customerId,
            slot,
        });

        const created = await this.appointments.create({
            customerId: input.customerId as never,
            providerId: input.providerId as never,
            serviceId: input.serviceId as never,
            startTime: slot.startTime,
            endTime: slot.endTime,
            durationMinutes: slot.durationMinutes,
            status: "booked",
            ...(input.notes ? { notes: input.notes } : {}),
        });

        const populated = await this.appointments.findByIdPopulated(String(created._id));
        if (!populated) throw ApiError.notFound("Appointment not found after creation");
        return populated;
    }

    public async list(filters: AppointmentFilters): Promise<PopulatedAppointment[]> {
        return this.appointments.findAllPopulated(filters);
    }

    public async getById(id: string): Promise<PopulatedAppointment> {
        const appointment = await this.appointments.findByIdPopulated(id);
        if (!appointment) throw ApiError.notFound("Appointment not found");
        return appointment;
    }

    /**
     * Moves an appointment to a new start time.
     *
     * The duration is the one stored on the appointment, not the one currently
     * on the service - a booking keeps the length it was made with. The clash
     * check passes `excludeId` so the appointment is not blocked by itself.
     */
    public async reschedule(id: string, startTime: Date): Promise<PopulatedAppointment> {
        const appointment = await this.getById(id);

        if (appointment.status !== "booked") {
            throw ApiError.badRequest(`Only booked appointments can be rescheduled. This one is ${appointment.status}.`);
        }

        const slot = TimeSlot.fromStart(startTime, appointment.durationMinutes);

        this.assertNotInPast(slot);
        await this.assertNoClashes({
            providerId: String(appointment.providerId._id),
            customerId: String(appointment.customerId._id),
            slot,
            excludeId: id,
        });

        await this.appointments.updateById(id, {
            startTime: slot.startTime,
            endTime: slot.endTime,
        });

        return this.getById(id);
    }

    /**
     * The only legal moves are booked -> completed and booked -> cancelled.
     *
     * Nothing leaves a terminal state: un-cancelling would silently re-take a
     * slot that someone else may already have booked. Rebooking is a new
     * appointment, which goes through the clash check like any other.
     */
    public async changeStatus(id: string, status: AppointmentStatus): Promise<PopulatedAppointment> {
        const appointment = await this.getById(id);

        if (appointment.status !== "booked") {
            throw ApiError.badRequest(
                `This appointment is already ${appointment.status} and cannot change status. Book a new one instead.`
            );
        }

        if (status === "booked") {
            throw ApiError.badRequest("An appointment is already booked when created.");
        }

        // A visit cannot be completed before it has started.
        if (status === "completed" && new Date() < appointment.startTime) {
            throw ApiError.badRequest("This appointment has not started yet, so it cannot be marked completed.");
        }

        await this.appointments.updateById(id, { status });
        return this.getById(id);
    }

    public async remove(id: string): Promise<void> {
        await this.getById(id);
        await this.appointments.deleteById(id);
    }
}
