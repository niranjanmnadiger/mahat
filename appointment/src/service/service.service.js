const serviceRepository = require(
    "../repositories/service.repository"
);

const providerRepository = require(
    "../repositories/provider.repository"
);

async function createService(data) {
    const provider = await providerRepository.findById(
        data.providerId
    );

    if (!provider) {
        const error = new Error("Provider not found");
        error.statusCode = 404;
        throw error;
    }

    return serviceRepository.create(data);
}

function getServices() {
    return serviceRepository.findAll();
}

async function deleteService(id) {
    const service = await serviceRepository.deleteById(id);

    if (!service) {
        const error = new Error("Service not found");
        error.statusCode = 404;
        throw error;
    }

    return service;
}

module.exports = {
    createService,
    getServices,
    deleteService,
};