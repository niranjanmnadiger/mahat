const Appointment = require("../models/appointment.model");

function create(data) {
    return Appointment.create(data);
}

function findAll() {
    return Appointment.find()
        .populate("customerId", "name phone email")
        .populate("providerId", "name type phone email")
        .populate(
            "serviceId",
            "name price durationMinutes"
        );
}

function findById(id) {
    return Appointment.findById(id);
}

function deleteById(id) {
    return Appointment.findByIdAndDelete(id);
}

module.exports = {
    create,
    findAll,
    findById,
    deleteById,
};