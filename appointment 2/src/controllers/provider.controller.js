const providerService = require("../services/provider.service");
const asyncHandler = require("../utils/asyncHandler");

const createProvider = asyncHandler(async (req, res) => {
    const provider = await providerService.createProvider(req.body);

    return res.status(201).json({
        success: true,
        message: "Provider created successfully",
        data: provider,
    });
});

const getProviders = asyncHandler(async (req, res) => {
    const providers = await providerService.getProviders();

    return res.status(200).json({
        success: true,
        count: providers.length,
        data: providers,
    });
});

const getProviderById = asyncHandler(async (req, res) => {
    const provider = await providerService.getProviderById(req.params.id);

    return res.status(200).json({ success: true, data: provider });
});

const deleteProvider = asyncHandler(async (req, res) => {
    await providerService.deleteProvider(req.params.id);

    return res.status(200).json({
        success: true,
        message: "Provider deleted successfully",
    });
});

module.exports = {
    createProvider,
    getProviders,
    getProviderById,
    deleteProvider,
};
