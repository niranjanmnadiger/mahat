const customerService = require("../services/customer.service");
const asyncHandler = require("../utils/asyncHandler");

const createCustomer = asyncHandler(async (req, res) => {
    const customer = await customerService.createCustomer(req.body);

    return res.status(201).json({
        success: true,
        message: "Customer created successfully",
        data: customer,
    });
});

const getCustomers = asyncHandler(async (req, res) => {
    const customers = await customerService.getCustomers();

    return res.status(200).json({
        success: true,
        count: customers.length,
        data: customers,
    });
});

const getCustomerById = asyncHandler(async (req, res) => {
    const customer = await customerService.getCustomerById(req.params.id);

    return res.status(200).json({ success: true, data: customer });
});

const deleteCustomer = asyncHandler(async (req, res) => {
    await customerService.deleteCustomer(req.params.id);

    return res.status(200).json({
        success: true,
        message: "Customer deleted successfully",
    });
});

module.exports = {
    createCustomer,
    getCustomers,
    getCustomerById,
    deleteCustomer,
};
