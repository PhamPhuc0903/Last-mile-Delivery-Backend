import express from "express";
import cors from "cors";
import notificationRoutes from "./routes/notification.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    service: process.env.SERVICE_NAME || "notification-service",
    status: "UP",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  });
});

app.use("/notifications", notificationRoutes);

export default app;