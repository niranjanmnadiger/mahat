const customerService = require("../services/customer.service");

async function createCustomer(req, res) {
    try {
        const customer = await customerService.createCustomer(req.body);

        return res.status(201).json({
            message: "Customer created successfully",
            data: customer,
        });
    } catch (error) {
        return res.status(error.statusCode || 400).json({
            message: error.message,
        });
    }
}

async function getCustomers(req, res) {
    try {
        const customers = await customerService.getCustomers();

        return res.status(200).json({
            data: customers,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message,
        });
    }
}

async function deleteCustomer(req, res) {
    try {
        await customerService.deleteCustomer(req.params.id);

        return res.status(200).json({
            message: "Customer deleted successfully",
        });
    } catch (error) {
        return res.status(error.statusCode || 400).json({
            message: error.message,
        });
    }
}

module.exports = {
    createCustomer,
    getCustomers,
    deleteCustomer,
};