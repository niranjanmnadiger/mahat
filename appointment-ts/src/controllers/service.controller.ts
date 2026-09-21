import * as serviceService from "../services/service.service";
import asyncHandler from "../utils/asyncHandler";

import type { ServiceQueryFilters } from "../repositories/service.repository";
import type { CreateServiceBody } from "../validations/service.validation";

export const createService = asyncHandler(async (req, res) => {
    const service = await serviceService.createService(req.body as CreateServiceBody);

    res.status(201).json({
        success: true,
        message: "Service created successfully",
        data: service,
    });
});

export const getServices = asyncHandler(async (req, res) => {
    const filters = (req.validatedQuery ?? {}) as ServiceQueryFilters;

    const services = await serviceService.getServices(filters);

    res.status(200).json({
        success: true,
        count: services.length,
        data: services,
    });
});

export const getServiceById = asyncHandler(async (req, res) => {
    const service = await serviceService.getServiceById(req.params.id);

    res.status(200).json({ success: true, data: service });
});

export const deleteService = asyncHandler(async (req, res) => {
    await serviceService.deleteService(req.params.id);

    res.status(200).json({
        success: true,
        message: "Service deleted successfully",
    });
});
