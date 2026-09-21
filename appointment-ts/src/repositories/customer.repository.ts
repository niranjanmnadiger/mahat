import { Customer, type CustomerDocument, type ICustomer } from "../models/customer.model";
import type { Id } from "./types";

export function create(data: ICustomer): Promise<CustomerDocument> {
    return Customer.create(data);
}

export function findAll(): Promise<CustomerDocument[]> {
    return Customer.find().sort({ createdAt: -1 }).exec();
}

export function findById(id: Id): Promise<CustomerDocument | null> {
    return Customer.findById(id).exec();
}

export function findByPhone(phone: string): Promise<CustomerDocument | null> {
    return Customer.findOne({ phone }).exec();
}

export function deleteById(id: Id): Promise<CustomerDocument | null> {
    return Customer.findByIdAndDelete(id).exec();
}
