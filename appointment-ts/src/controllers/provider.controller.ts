import * as providerService from "../services/provider.service";
import asyncHandler from "../utils/asyncHandler";

import type { CreateProviderBody } from "../validations/provider.validation";

export const createProvider = asyncHandler(async (req, res) => {
    const provider = await providerService.createProvider(req.body as CreateProviderBody);

    res.status(201).json({
        success: true,
        message: "Provider created successfully",
        data: provider,
    });
});

export const getProviders = asyncHandler(async (_req, res) => {
    const providers = await providerService.getProviders();

    res.status(200).json({
        success: true,
        count: providers.length,
        data: providers,
    });
});

export const getProviderById = asyncHandler(async (req, res) => {
    const provider = await providerService.getProviderById(req.params.id);

    res.status(200).json({ success: true, data: provider });
});

export const deleteProvider = asyncHandler(async (req, res) => {
    await providerService.deleteProvider(req.params.id);

    res.status(200).json({
        success: true,
        message: "Provider deleted successfully",
    });
});
