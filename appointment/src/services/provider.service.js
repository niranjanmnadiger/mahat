const providerRepository = require(
    "../repositories/provider.repository"
);

function createProvider(data) {
    return providerRepository.create(data);
}

function getProviders() {
    return providerRepository.findAll();
}

async function deleteProvider(id) {
    const provider = await providerRepository.deleteById(id);

    if (!provider) {
        const error = new Error("Provider not found");
        error.statusCode = 404;
        throw error;
    }

    return provider;
}

module.exports = {
    createProvider,
    getProviders,
    deleteProvider,
};