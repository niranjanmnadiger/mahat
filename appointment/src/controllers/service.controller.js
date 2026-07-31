const serviceService = require("../services/service.service");

async function createService(req, res) {
    try {
        const service = await serviceService.createService(req.body);

        return res.status(201).json({
            message: "Service created successfully",
            data: service,
        });
    } catch (error) {
        return res.status(error.statusCode || 400).json({
            message: error.message,
        });
    }
}

async function getServices(req, res) {
    try {
        const services = await serviceService.getServices();

        return res.status(200).json({
            data: services,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message,
        });
    }
}

async function deleteService(req, res) {
    try {
        await serviceService.deleteService(req.params.id);

        return res.status(200).json({
            message: "Service deleted successfully",
        });
    } catch (error) {
        return res.status(error.statusCode || 400).json({
            message: error.message,
        });
    }
}

module.exports = {
    createService,
    getServices,
    deleteService,
};