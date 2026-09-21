import * as appointmentRepository from "../repositories/appointment.repository";
import * as providerRepository from "../repositories/provider.repository";
import * as serviceRepository from "../repositories/service.repository";

import type {
    CreateServiceData,
    ServiceQueryFilters,
} from "../repositories/service.repository";
import type { ServiceDocument } from "../models/service.model";
import ApiError from "../utils/ApiError";

export async function createService(data: CreateServiceData): Promise<ServiceDocument> {
    const provider = await providerRepository.findById(data.providerId);

    if (!provider) throw new ApiError(404, "Provider not found");

    return serviceRepository.create(data);
}

export function getServices(filters: ServiceQueryFilters = {}): Promise<ServiceDocument[]> {
    return serviceRepository.findAll(filters);
}

export async function getServiceById(id: string): Promise<ServiceDocument> {
    const service = await serviceRepository.findById(id);

    if (!service) throw new ApiError(404, "Service not found");

    return service;
}

export async function deleteService(id: string): Promise<ServiceDocument | null> {
    const service = await serviceRepository.findById(id);

    if (!service) throw new ApiError(404, "Service not found");

    const activeCount = await appointmentRepository.countActiveByField("serviceId", id);

    if (activeCount > 0) {
        throw new ApiError(
            409,
            `Cannot delete service with ${activeCount} booked appointment(s). Cancel them first.`
        );
    }

    return serviceRepository.deleteById(id);
}
