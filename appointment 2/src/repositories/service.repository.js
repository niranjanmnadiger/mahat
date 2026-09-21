const Service = require("../models/service.model");

function create(data) {
    return Service.create(data);
}

function findAll(filters = {}) {
    const query = {};

    if (filters.providerId) query.providerId = filters.providerId;

    return Service.find(query).populate("providerId", "name type phone email");
}

function findById(id) {
    return Service.findById(id);
}

function findByProviderId(providerId) {
    return Service.find({ providerId });
}

function deleteById(id) {
    return Service.findByIdAndDelete(id);
}

module.exports = {
    create,
    findAll,
    findById,
    findByProviderId,
    deleteById,
};
