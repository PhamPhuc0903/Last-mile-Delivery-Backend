import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { fileURLToPath } from "url";

import gatewayRoutes from "./routes/gateway.routes.js";
import { corsOptions, securityMiddleware } from "./middlewares/security.middleware.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerDocument = YAML.load(
    path.join(__dirname, "docs", "openapi.yaml")
);

app.disable("x-powered-by");
app.set("trust proxy", Number(process.env.TRUST_PROXY || 1));

app.use(cors(corsOptions));
app.use(securityMiddleware);

app.get("/health", (req, res) => {
  res.status(200).json({
    service: process.env.SERVICE_NAME || "api-gateway",
    status: "UP",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  });
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/", (req, res) => {
  res.status(200).json({
    service: "Last Mile Delivery API Gateway",
    status: "UP",
    docs: "/docs",
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
      chatbot: "/chatbot",
      admin: "/admin"
    }
  });
});

app.use(gatewayRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Gateway route not found: ${req.method} ${req.originalUrl}`
  });
});

export default app;