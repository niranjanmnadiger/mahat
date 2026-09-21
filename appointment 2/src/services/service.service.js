const serviceRepository = require("../repositories/service.repository");
const providerRepository = require("../repositories/provider.repository");
const appointmentRepository = require("../repositories/appointment.repository");
const ApiError = require("../utils/ApiError");

async function createService(data) {
    const provider = await providerRepository.findById(data.providerId);

    if (!provider) throw new ApiError(404, "Provider not found");

    return serviceRepository.create(data);
}

function getServices(filters = {}) {
    return serviceRepository.findAll(filters);
}

async function getServiceById(id) {
    const service = await serviceRepository.findById(id);

    if (!service) throw new ApiError(404, "Service not found");

    return service;
}

async function deleteService(id) {
    const service = await serviceRepository.findById(id);

    if (!service) throw new ApiError(404, "Service not found");

    const activeCount = await appointmentRepository.countActiveByField(
        "serviceId",
        id
    );

    if (activeCount > 0) {
        throw new ApiError(
            409,
            `Cannot delete service with ${activeCount} booked appointment(s). Cancel them first.`
        );
    }

    return serviceRepository.deleteById(id);
}

module.exports = {
    createService,
    getServices,
    getServiceById,
    deleteService,
};
