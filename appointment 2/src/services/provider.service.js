const providerRepository = require("../repositories/provider.repository");
const appointmentRepository = require("../repositories/appointment.repository");
const ApiError = require("../utils/ApiError");

function createProvider(data) {
    return providerRepository.create(data);
}

function getProviders() {
    return providerRepository.findAll();
}

async function getProviderById(id) {
    const provider = await providerRepository.findById(id);

    if (!provider) throw new ApiError(404, "Provider not found");

    return provider;
}

async function deleteProvider(id) {
    const provider = await providerRepository.findById(id);

    if (!provider) throw new ApiError(404, "Provider not found");

    const activeCount = await appointmentRepository.countActiveByField(
        "providerId",
        id
    );

    if (activeCount > 0) {
        throw new ApiError(
            409,
            `Cannot delete provider with ${activeCount} booked appointment(s). Cancel them first.`
        );
    }

    return providerRepository.deleteById(id);
}

module.exports = {
    createProvider,
    getProviders,
    getProviderById,
    deleteProvider,
};
