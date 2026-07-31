const providerService = require("../services/provider.service");

async function createProvider(req, res) {
    try {
        const provider = await providerService.createProvider(req.body);

        return res.status(201).json({
            message: "Provider created successfully",
            data: provider,
        });
    } catch (error) {
        return res.status(error.statusCode || 400).json({
            message: error.message,
        });
    }
}

async function getProviders(req, res) {
    try {
        const providers = await providerService.getProviders();

        return res.status(200).json({
            data: providers,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message,
        });
    }
}

async function deleteProvider(req, res) {
    try {
        await providerService.deleteProvider(req.params.id);

        return res.status(200).json({
            message: "Provider deleted successfully",
        });
    } catch (error) {
        return res.status(error.statusCode || 400).json({
            message: error.message,
        });
    }
}

module.exports = {
    createProvider,
    getProviders,
    deleteProvider,
};