const Customer = require("../models/customer.model");

function create(data) {
    return Customer.create(data);
}

function findAll() {
    return Customer.find();
}

function findById(id) {
    return Customer.findById(id);
}

function findByPhone(phone) {
    return Customer.findOne({ phone });
}

function deleteById(id) {
    return Customer.findByIdAndDelete(id);
}

module.exports = {
    create,
    findAll,
    findById,
    findByPhone,
    deleteById,
};