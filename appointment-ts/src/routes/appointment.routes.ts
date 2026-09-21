import { Router } from "express";

import {
    createAppointment,
    deleteAppointment,
    getAppointmentById,
    getAppointments,
    rescheduleAppointment,
    updateAppointmentStatus,
} from "../controllers/appointment.controller";

import { validate } from "../middlewares/validate";
import { idParamSchema } from "../validations/common.validation";
import {
    createAppointmentSchema,
    listAppointmentSchema,
    rescheduleAppointmentSchema,
    updateStatusSchema,
} from "../validations/appointment.validation";

const router = Router();

router.post("/", validate(createAppointmentSchema), createAppointment);
router.get("/", validate(listAppointmentSchema), getAppointments);
router.get("/:id", validate(idParamSchema), getAppointmentById);

// Move an existing booking to a different start time (re-runs the clash checks).
router.patch("/:id/reschedule", validate(rescheduleAppointmentSchema), rescheduleAppointment);

// Cancel or complete a booking. Cancelling frees the slot for others.
router.patch("/:id/status", validate(updateStatusSchema), updateAppointmentStatus);

router.delete("/:id", validate(idParamSchema), deleteAppointment);

export default router;
