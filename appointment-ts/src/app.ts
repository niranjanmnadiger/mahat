import express, { type Application } from "express";

import appointmentRoutes from "./routes/appointment.routes";
import customerRoutes from "./routes/customer.routes";
import providerRoutes from "./routes/provider.routes";
import serviceRoutes from "./routes/service.routes";

import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";

const app: Application = express();

app.use(express.json({ limit: "100kb" }));

app.get("/health", (_req, res) => {
    res.status(200).json({ success: true, message: "API is running" });
});

app.use("/customers", customerRoutes);
app.use("/providers", providerRoutes);
app.use("/services", serviceRoutes);
app.use("/appointments", appointmentRoutes);

// Must come after the routes.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
