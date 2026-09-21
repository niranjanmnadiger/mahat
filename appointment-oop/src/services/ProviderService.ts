import type { ProviderAttrs, ProviderDocument } from "../models/provider.model";
import type { AppointmentRepository } from "../repositories/AppointmentRepository";
import type { ProviderRepository } from "../repositories/ProviderRepository";
import type { ServiceRepository } from "../repositories/ServiceRepository";
import { ApiError } from "../utils/ApiError";

export class ProviderService {
    public constructor(
        private readonly providers: ProviderRepository,
        private readonly services: ServiceRepository,
        private readonly appointments: AppointmentRepository
    ) {}

    public async create(data: ProviderAttrs): Promise<ProviderDocument> {
        return this.providers.create(data);
    }

    public async list(): Promise<ProviderDocument[]> {
        return this.providers.findAll();
    }

    public async getById(id: string): Promise<ProviderDocument> {
        const provider = await this.providers.findById(id);
        if (!provider) throw ApiError.notFound("Provider not found");
        return provider;
    }

    public async remove(id: string): Promise<void> {
        await this.getById(id);

        const booked = await this.appointments.countBookedByField("providerId", id);
        if (booked > 0) {
            throw ApiError.badRequest(
                `Cannot delete this provider: ${booked} booked appointment(s) still reference them. Cancel those first.`
            );
        }

        // A service whose provider is gone can never be booked, so it goes too.
        const owned = await this.services.findByProvider(id);
        for (const service of owned) {
            await this.services.deleteById(String(service._id));
        }

        await this.providers.deleteById(id);
    }
}
