import * as customerService from "../services/customer.service";
import asyncHandler from "../utils/asyncHandler";

import type { CreateCustomerBody } from "../validations/customer.validation";

export const createCustomer = asyncHandler(async (req, res) => {
    const customer = await customerService.createCustomer(req.body as CreateCustomerBody);

    res.status(201).json({
        success: true,
        message: "Customer created successfully",
        data: customer,
    });
});

export const getCustomers = asyncHandler(async (_req, res) => {
    const customers = await customerService.getCustomers();

    res.status(200).json({
        success: true,
        count: customers.length,
        data: customers,
    });
});

export const getCustomerById = asyncHandler(async (req, res) => {
    const customer = await customerService.getCustomerById(req.params.id);

    res.status(200).json({ success: true, data: customer });
});

export const deleteCustomer = asyncHandler(async (req, res) => {
    await customerService.deleteCustomer(req.params.id);

    res.status(200).json({
        success: true,
        message: "Customer deleted successfully",
    });
});
