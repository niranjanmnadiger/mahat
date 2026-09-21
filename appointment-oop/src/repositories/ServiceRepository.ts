import { Service, type ServiceAttrs, type ServiceDocument } from "../models/service.model";
import { BaseRepository } from "./BaseRepository";

export class ServiceRepository extends BaseRepository<ServiceDocument, ServiceAttrs> {
    public constructor() {
        super(Service);
    }

    public async findByProvider(providerId: string): Promise<ServiceDocument[]> {
        return this.model.find({ providerId }).sort({ name: 1 }).exec();
    }
}
