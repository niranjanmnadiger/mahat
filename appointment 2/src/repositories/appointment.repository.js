const Appointment = require("../models/appointment.model");

// A cancelled appointment frees its slot. Everything else still occupies it.
const SLOT_BLOCKING_STATUSES = ["booked", "completed"];

const POPULATE = [
    { path: "customerId", select: "name phone email" },
    { path: "providerId", select: "name type phone email" },
    { path: "serviceId", select: "name price durationMinutes" },
];

function create(data) {
    return Appointment.create(data);
}

/**
 * @param {object} filters - optional providerId, customerId, status, from, to
 */
function findAll(filters = {}) {
    const query = {};

    if (filters.providerId) query.providerId = filters.providerId;
    if (filters.customerId) query.customerId = filters.customerId;
    if (filters.status) query.status = filters.status;

    // `from`/`to` bound the window by start time.
    if (filters.from || filters.to) {
        query.startTime = {};
        if (filters.from) query.startTime.$gte = filters.from;
        if (filters.to) query.startTime.$lte = filters.to;
    }

    return Appointment.find(query).sort({ startTime: 1 }).populate(POPULATE);
}

function findById(id) {
    return Appointment.findById(id);
}

function findByIdPopulated(id) {
    return Appointment.findById(id).populate(POPULATE);
}

/**
 * Core conflict query.
 *
 * Finds the first slot-blocking appointment for `field` (providerId or
 * customerId) that overlaps [startTime, endTime).
 *
 * Overlap in Mongo terms: existing.startTime < newEnd AND existing.endTime > newStart.
 * Strict comparison means back-to-back bookings are not treated as conflicts.
 *
 * @param {string}  field     - "providerId" | "customerId"
 * @param {string}  id        - the provider or customer id
 * @param {Date}    startTime - proposed slot start
 * @param {Date}    endTime   - proposed slot end
 * @param {string} [excludeId]- appointment to ignore (used when rescheduling itself)
 */
function findOverlapping({ field, id, startTime, endTime, excludeId }) {
    const query = {
        [field]: id,
        status: { $in: SLOT_BLOCKING_STATUSES },
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
    };

    if (excludeId) {
        query._id = { $ne: excludeId };
    }

    return Appointment.findOne(query).populate(POPULATE);
}

function findOverlappingForProvider(providerId, startTime, endTime, excludeId) {
    return findOverlapping({
        field: "providerId",
        id: providerId,
        startTime,
        endTime,
        excludeId,
    });
}

function findOverlappingForCustomer(customerId, startTime, endTime, excludeId) {
    return findOverlapping({
        field: "customerId",
        id: customerId,
        startTime,
        endTime,
        excludeId,
    });
}

/**
 * Counts still-live bookings pointing at a customer, provider or service.
 * Used to stop deletion of an entity that upcoming appointments depend on.
 */
function countActiveByField(field, id) {
    return Appointment.countDocuments({
        [field]: id,
        status: "booked",
    });
}

function updateById(id, update) {
    return Appointment.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
    }).populate(POPULATE);
}

function deleteById(id) {
    return Appointment.findByIdAndDelete(id);
}

module.exports = {
    SLOT_BLOCKING_STATUSES,
    create,
    findAll,
    findById,
    findByIdPopulated,
    findOverlapping,
    findOverlappingForProvider,
    findOverlappingForCustomer,
    countActiveByField,
    updateById,
    deleteById,
};
