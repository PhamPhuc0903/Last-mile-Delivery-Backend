import express from "express";
import cors from "cors";
import gatewayRoutes from "./routes/gateway.routes.js";

const app = express();

app.use(cors());

app.get("/health", (req, res) => {
  res.status(200).json({
    service: process.env.SERVICE_NAME || "api-gateway",
    status: "UP",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    service: "Last Mile Delivery API Gateway",
    status: "UP",
    routes: {
      auth: "/auth",
      users: "/users",
      orders: "/orders",
      payments: "/payments",
      drivers: "/drivers",
      tracking: "/tracking",
      dispatch: "/dispatch",
      notifications: "/notifications",
      ai: "/ai",
      chatbot: "/chatbot"
    }
  });
});

app.use(gatewayRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Gateway route not found"
  });
});

export default app;