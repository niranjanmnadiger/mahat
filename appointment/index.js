require("dotenv").config();

const express = require("express");

const {
    connectDB,
    Customer,
    Provider,
    Service,
    Appointment,
} = require("./db");

const app = express();

app.use(express.json());

connectDB();

//customer api


// Create customer
app.put("/customers", async (req, res) => {
    try {
        const customer = await Customer.create(req.body);

        res.status(201).json({
            message: "Customer created successfully",
            data: customer,
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
});

// Get all customers
app.get("/customers", async (req, res) => {
    try {
        const customers = await Customer.find();

        res.status(200).json({
            data: customers,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
});

// Delete customer
app.delete("/customers/:id", async (req, res) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);

        if (!customer) {
            return res.status(404).json({
                message: "Customer not found",
            });
        }

        res.status(200).json({
            message: "Customer deleted successfully",
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
});

//         provider api

// Create provider
app.put("/providers", async (req, res) => {
    try {
        const provider = await Provider.create(req.body);

        res.status(201).json({
            message: "Provider created successfully",
            data: provider,
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
});

// Get all providers
app.get("/providers", async (req, res) => {
    try {
        const providers = await Provider.find();

        res.status(200).json({
            data: providers,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
});

// Delete provider
app.delete("/providers/:id", async (req, res) => {
    try {
        const provider = await Provider.findByIdAndDelete(req.params.id);

        if (!provider) {
            return res.status(404).json({
                message: "Provider not found",
            });
        }

        res.status(200).json({
            message: "Provider deleted successfully",
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
});

//service api


// Create service
app.put("/services", async (req, res) => {
    try {
        const provider = await Provider.findById(req.body.providerId);

        if (!provider) {
            return res.status(404).json({
                message: "Provider not found",
            });
        }

        const service = await Service.create(req.body);

        res.status(201).json({
            message: "Service created successfully",
            data: service,
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
});

// Get all services with provider details
app.get("/services", async (req, res) => {
    try {
        const services = await Service.find().populate(
            "providerId",
            "name type phone email"
        );

        res.status(200).json({
            data: services,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
});

// Delete service
app.delete("/services/:id", async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);

        if (!service) {
            return res.status(404).json({
                message: "Service not found",
            });
        }

        res.status(200).json({
            message: "Service deleted successfully",
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
});

//appointments api

// Create appointment
app.put("/appointments", async (req, res) => {
    try {
        const { customerId, providerId, serviceId } = req.body;

        const customer = await Customer.findById(customerId);

        if (!customer) {
            return res.status(404).json({
                message: "Customer not found",
            });
        }

        const provider = await Provider.findById(providerId);

        if (!provider) {
            return res.status(404).json({
                message: "Provider not found",
            });
        }

        const service = await Service.findById(serviceId);

        if (!service) {
            return res.status(404).json({
                message: "Service not found",
            });
        }

        // Check whether the selected service belongs to the provider
        if (service.providerId.toString() !== providerId) {
            return res.status(400).json({
                message: "This service does not belong to the selected provider",
            });
        }

        const appointment = await Appointment.create(req.body);

        res.status(201).json({
            message: "Appointment created successfully",
            data: appointment,
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
});

// Get all appointments with referenced data
app.get("/appointments", async (req, res) => {
    try {
        const appointments = await Appointment.find()
            .populate("customerId", "name phone email")
            .populate("providerId", "name type phone email")
            .populate("serviceId", "name price durationMinutes");

        res.status(200).json({
            data: appointments,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
});

// Delete appointment
app.delete("/appointments/:id", async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndDelete(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found",
            });
        }

        res.status(200).json({
            message: "Appointment deleted successfully",
        });
    } catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
});



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});