import { Provider, type IProvider, type ProviderDocument } from "../models/provider.model";
import type { Id } from "./types";

export function create(data: IProvider): Promise<ProviderDocument> {
    return Provider.create(data);
}

export function findAll(): Promise<ProviderDocument[]> {
    return Provider.find().sort({ createdAt: -1 }).exec();
}

export function findById(id: Id): Promise<ProviderDocument | null> {
    return Provider.findById(id).exec();
}

export function deleteById(id: Id): Promise<ProviderDocument | null> {
    return Provider.findByIdAndDelete(id).exec();
}
