import { Customer, type CustomerAttrs, type CustomerDocument } from "../models/customer.model";
import { BaseRepository } from "./BaseRepository";

export class CustomerRepository extends BaseRepository<CustomerDocument, CustomerAttrs> {
    public constructor() {
        // Binds this repository to one collection. Everything in BaseRepository
        // now runs against Customer and nothing else.
        super(Customer);
    }

    public async findByPhone(phone: string): Promise<CustomerDocument | null> {
        return this.model.findOne({ phone }).exec();
    }
}
