import * as appointmentRepository from "../repositories/appointment.repository";
import * as providerRepository from "../repositories/provider.repository";

import type { IProvider, ProviderDocument } from "../models/provider.model";
import ApiError from "../utils/ApiError";

export function createProvider(data: IProvider): Promise<ProviderDocument> {
    return providerRepository.create(data);
}

export function getProviders(): Promise<ProviderDocument[]> {
    return providerRepository.findAll();
}

export async function getProviderById(id: string): Promise<ProviderDocument> {
    const provider = await providerRepository.findById(id);

    if (!provider) throw new ApiError(404, "Provider not found");

    return provider;
}

export async function deleteProvider(id: string): Promise<ProviderDocument | null> {
    const provider = await providerRepository.findById(id);

    if (!provider) throw new ApiError(404, "Provider not found");

    const activeCount = await appointmentRepository.countActiveByField("providerId", id);

    if (activeCount > 0) {
        throw new ApiError(
            409,
            `Cannot delete provider with ${activeCount} booked appointment(s). Cancel them first.`
        );
    }

    return providerRepository.deleteById(id);
}
