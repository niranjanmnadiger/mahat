const appointmentRepository = require(
    "../repositories/appointment.repository"
);

const customerRepository = require(
    "../repositories/customer.repository"
);

const providerRepository = require(
    "../repositories/provider.repository"
);

const serviceRepository = require(
    "../repositories/service.repository"
);

async function createAppointment(data) {
    const {
        customerId,
        providerId,
        serviceId,
    } = data;

    const customer = await customerRepository.findById(customerId);

    if (!customer) {
        const error = new Error("Customer not found");
        error.statusCode = 404;
        throw error;
    }

    const provider = await providerRepository.findById(providerId);

    if (!provider) {
        const error = new Error("Provider not found");
        error.statusCode = 404;
        throw error;
    }

    const service = await serviceRepository.findById(serviceId);

    if (!service) {
        const error = new Error("Service not found");
        error.statusCode = 404;
        throw error;
    }

    if (service.providerId.toString() !== providerId.toString()) {
        const error = new Error(
            "This service does not belong to the selected provider"
        );

        error.statusCode = 400;
        throw error;
    }

    //check if there is a overlapping slot - the parameters should be the starting time and ending time 


    return appointmentRepository.create(data);
}



function getAppointments() {
    return appointmentRepository.findAll();
}

async function deleteAppointment(id) {
    const appointment =
        await appointmentRepository.deleteById(id);

    if (!appointment) {
        const error = new Error("Appointment not found");
        error.statusCode = 404;
        throw error;
    }

    return appointment;
}

module.exports = {
    createAppointment,
    getAppointments,
    deleteAppointment,
};