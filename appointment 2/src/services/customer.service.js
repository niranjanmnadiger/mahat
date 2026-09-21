const customerRepository = require("../repositories/customer.repository");
const appointmentRepository = require("../repositories/appointment.repository");
const ApiError = require("../utils/ApiError");

async function createCustomer(data) {
    const existingCustomer = await customerRepository.findByPhone(data.phone);

    if (existingCustomer) {
        throw new ApiError(409, "Phone number already registered");
    }

    return customerRepository.create(data);
}

function getCustomers() {
    return customerRepository.findAll();
}

async function getCustomerById(id) {
    const customer = await customerRepository.findById(id);

    if (!customer) throw new ApiError(404, "Customer not found");

    return customer;
}

async function deleteCustomer(id) {
    const customer = await customerRepository.findById(id);

    if (!customer) throw new ApiError(404, "Customer not found");

    const activeCount = await appointmentRepository.countActiveByField(
        "customerId",
        id
    );

    if (activeCount > 0) {
        throw new ApiError(
            409,
            `Cannot delete customer with ${activeCount} booked appointment(s). Cancel them first.`
        );
    }

    return customerRepository.deleteById(id);
}

module.exports = {
    createCustomer,
    getCustomers,
    getCustomerById,
    deleteCustomer,
};
