const appointmentService = require(
    "../services/appointment.service"
);

async function createAppointment(req, res) {
    try {
        const appointment =
            await appointmentService.createAppointment(req.body);

        return res.status(201).json({
            message: "Appointment created successfully",
            data: appointment,
        });
    } catch (error) {
        return res.status(error.statusCode || 400).json({
            message: error.message,
        });
    }
}

async function getAppointments(req, res) {
    try {
        const appointments =
            await appointmentService.getAppointments();

        return res.status(200).json({
            data: appointments,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message,
        });
    }
}

async function deleteAppointment(req, res) {
    try {
        await appointmentService.deleteAppointment(req.params.id);

        return res.status(200).json({
            message: "Appointment deleted successfully",
        });
    } catch (error) {
        return res.status(error.statusCode || 400).json({
            message: error.message,
        });
    }
}

module.exports = {
    createAppointment,
    getAppointments,
    deleteAppointment,
};