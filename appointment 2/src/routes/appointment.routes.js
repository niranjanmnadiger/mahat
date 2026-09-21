const express = require("express");

const {
    createAppointment,
    getAppointments,
    getAppointmentById,
    rescheduleAppointment,
    updateAppointmentStatus,
    deleteAppointment,
} = require("../controllers/appointment.controller");

const { validate } = require("../middlewares/validate");
const { idParamSchema } = require("../validations/common.validation");

const {
    createAppointmentSchema,
    rescheduleAppointmentSchema,
    updateStatusSchema,
    listAppointmentSchema,
} = require("../validations/appointment.validation");

const router = express.Router();

router.post("/", validate(createAppointmentSchema), createAppointment);
router.get("/", validate(listAppointmentSchema), getAppointments);
router.get("/:id", validate(idParamSchema), getAppointmentById);

// Move an existing booking to a different slot (re-runs the conflict checks).
router.patch(
    "/:id/reschedule",
    validate(rescheduleAppointmentSchema),
    rescheduleAppointment
);

// Cancel or complete a booking. Cancelling frees the slot for others.
router.patch("/:id/status", validate(updateStatusSchema), updateAppointmentStatus);

router.delete("/:id", validate(idParamSchema), deleteAppointment);

module.exports = router;
