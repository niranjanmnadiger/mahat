const express = require("express");

const customerRoutes = require("./routes/customer.routes");
const providerRoutes = require("./routes/provider.routes");
const serviceRoutes = require("./routes/service.routes");
const appointmentRoutes = require("./routes/appointment.routes");

const { notFoundHandler, errorHandler } = require("./middlewares/error.middleware");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({ success: true, message: "API is running" });
});

app.use("/customers", customerRoutes);
app.use("/providers", providerRoutes);
app.use("/services", serviceRoutes);
app.use("/appointments", appointmentRoutes);

// Must come after the routes.
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
