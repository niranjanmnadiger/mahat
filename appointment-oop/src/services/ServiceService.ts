import type { ServiceAttrs, ServiceDocument } from "../models/service.model";
import type { AppointmentRepository } from "../repositories/AppointmentRepository";
import type { ProviderRepository } from "../repositories/ProviderRepository";
import type { ServiceRepository } from "../repositories/ServiceRepository";
import { ApiError } from "../utils/ApiError";

/**
 * "Service" is unfortunately two things in this codebase: the business-logic
 * layer, and the bookable offering (a 30 minute consultation). This class is
 * the layer that manages the offering.
 */
export class ServiceService {
    public constructor(
        private readonly services: ServiceRepository,
        private readonly providers: ProviderRepository,
        private readonly appointments: AppointmentRepository
    ) {}

    public async create(data: ServiceAttrs): Promise<ServiceDocument> {
        // A service must belong to a real provider, or every appointment
        // booked against it would be unusable.
        const provider = await this.providers.findById(String(data.providerId));
        if (!provider) throw ApiError.badRequest("providerId does not match any provider");

        return this.services.create(data);
    }

    public async list(providerId?: string): Promise<ServiceDocument[]> {
        return providerId ? this.services.findByProvider(providerId) : this.services.findAll();
    }

    public async getById(id: string): Promise<ServiceDocument> {
        const service = await this.services.findById(id);
        if (!service) throw ApiError.notFound("Service not found");
        return service;
    }

    public async remove(id: string): Promise<void> {
        await this.getById(id);

        const booked = await this.appointments.countBookedByField("serviceId", id);
        if (booked > 0) {
            throw ApiError.badRequest(
                `Cannot delete this service: ${booked} booked appointment(s) still reference it. Cancel those first.`
            );
        }

        await this.services.deleteById(id);
    }
}
