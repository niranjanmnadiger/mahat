import { Types } from "mongoose";

import { Service, type ServiceDocument } from "../models/service.model";
import type { Id } from "./types";

export interface CreateServiceData {
    name: string;
    description?: string;
    price: number;
    durationMinutes: number;
    providerId: string;
}

export interface ServiceQueryFilters {
    providerId?: string;
}

export function create(data: CreateServiceData): Promise<ServiceDocument> {
    return Service.create({
        ...data,
        providerId: new Types.ObjectId(data.providerId),
    });
}

export function findAll(filters: ServiceQueryFilters = {}): Promise<ServiceDocument[]> {
    const query: Record<string, unknown> = {};

    if (filters.providerId) query.providerId = filters.providerId;

    return Service.find(query)
        .sort({ createdAt: -1 })
        .populate("providerId", "name type phone email")
        .exec();
}

export function findById(id: Id): Promise<ServiceDocument | null> {
    return Service.findById(id).exec();
}

export function findByProviderId(providerId: Id): Promise<ServiceDocument[]> {
    return Service.find({ providerId }).exec();
}

export function deleteById(id: Id): Promise<ServiceDocument | null> {
    return Service.findByIdAndDelete(id).exec();
}
