import express from "express";
import cors from "cors";
import driverRoutes from "./routes/driver.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    service: process.env.SERVICE_NAME || "driver-service",
    status: "UP",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  });
});

app.use("/drivers", driverRoutes);

export default app;