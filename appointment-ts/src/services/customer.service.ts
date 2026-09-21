import * as appointmentRepository from "../repositories/appointment.repository";
import * as customerRepository from "../repositories/customer.repository";

import type { CustomerDocument, ICustomer } from "../models/customer.model";
import ApiError from "../utils/ApiError";

export async function createCustomer(data: ICustomer): Promise<CustomerDocument> {
    const existingCustomer = await customerRepository.findByPhone(data.phone);

    if (existingCustomer) {
        throw new ApiError(409, "Phone number already registered");
    }

    return customerRepository.create(data);
}

export function getCustomers(): Promise<CustomerDocument[]> {
    return customerRepository.findAll();
}

export async function getCustomerById(id: string): Promise<CustomerDocument> {
    const customer = await customerRepository.findById(id);

    if (!customer) throw new ApiError(404, "Customer not found");

    return customer;
}

export async function deleteCustomer(id: string): Promise<CustomerDocument | null> {
    const customer = await customerRepository.findById(id);

    if (!customer) throw new ApiError(404, "Customer not found");

    const activeCount = await appointmentRepository.countActiveByField("customerId", id);

    if (activeCount > 0) {
        throw new ApiError(
            409,
            `Cannot delete customer with ${activeCount} booked appointment(s). Cancel them first.`
        );
    }

    return customerRepository.deleteById(id);
}
