require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");

const customerRoutes = require("./routes/customer.routes");
const providerRoutes = require("./routes/provider.routes");
const serviceRoutes = require("./routes/service.routes");
const appointmentRoutes = require("./routes/appointment.routes");

const app = express();

app.use(express.json());

app.use("/customers", customerRoutes);
app.use("/providers", providerRoutes);
app.use("/services", serviceRoutes);
app.use("/appointments", appointmentRoutes);

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

startServer();