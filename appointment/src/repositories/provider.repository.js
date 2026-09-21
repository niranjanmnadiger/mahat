const Provider = require("../models/provider.model");

function create(data) {
    return Provider.create(data);
}

function findAll() {
    return Provider.find();
}

function findById(id) {
    return Provider.findById(id);
}

function deleteById(id) {
    return Provider.findByIdAndDelete(id);
}

module.exports = {
    create,
    findAll,
    findById,
    deleteById,
};