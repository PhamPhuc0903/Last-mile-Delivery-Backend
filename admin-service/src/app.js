import express from "express";
import cors from "cors";
import adminRoutes from "./routes/admin.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    service: process.env.SERVICE_NAME || "admin-service",
    status: "UP",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  });
});

app.use("/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Admin route not found"
  });
});

export default app;