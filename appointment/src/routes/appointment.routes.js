const express = require("express");

const {
    createAppointment,
    getAppointments,
    deleteAppointment,
} = require("../controllers/appointment.controller");

const router = express.Router();

router.post("/", createAppointment);
router.get("/", getAppointments);
router.delete("/:id", deleteAppointment);

module.exports = router;