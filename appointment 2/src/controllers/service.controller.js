const serviceService = require("../services/service.service");
const asyncHandler = require("../utils/asyncHandler");

const createService = asyncHandler(async (req, res) => {
    const service = await serviceService.createService(req.body);

    return res.status(201).json({
        success: true,
        message: "Service created successfully",
        data: service,
    });
});

const getServices = asyncHandler(async (req, res) => {
    const services = await serviceService.getServices(req.validatedQuery || {});

    return res.status(200).json({
        success: true,
        count: services.length,
        data: services,
    });
});

const getServiceById = asyncHandler(async (req, res) => {
    const service = await serviceService.getServiceById(req.params.id);

    return res.status(200).json({ success: true, data: service });
});

const deleteService = asyncHandler(async (req, res) => {
    await serviceService.deleteService(req.params.id);

    return res.status(200).json({
        success: true,
        message: "Service deleted successfully",
    });
});

module.exports = {
    createService,
    getServices,
    getServiceById,
    deleteService,
};
