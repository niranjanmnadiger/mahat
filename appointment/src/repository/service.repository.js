const Service = require("../models/service.model");

function create(data) {
    return Service.create(data);
}

function findAll() {
    return Service.find().populate(
        "providerId",
        "name type phone email"
    );
}

function findById(id) {
    return Service.findById(id);
}

function deleteById(id) {
    return Service.findByIdAndDelete(id);
}

module.exports = {
    create,
    findAll,
    findById,
    deleteById,
};