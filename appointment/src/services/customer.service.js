const customerRepository = require(
    "../repositories/customer.repository"
);

async function createCustomer(data) {
    const existingCustomer =
        await customerRepository.findByPhone(data.phone);

    if (existingCustomer) {
        const error = new Error("Phone number already registered");
        error.statusCode = 409;
        throw error;
    }

    return customerRepository.create(data);
}

function getCustomers() {
    return customerRepository.findAll();
}

async function deleteCustomer(id) {
    const customer = await customerRepository.deleteById(id);

    if (!customer) {
        const error = new Error("Customer not found");
        error.statusCode = 404;
        throw error;
    }

    return customer;
}

module.exports = {
    createCustomer,
    getCustomers,
    deleteCustomer,
};