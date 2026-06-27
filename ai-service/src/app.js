import express from "express";
import cors from "cors";
import aiRoutes from "./routes/ai.routes.js";
import { corsOptions, securityMiddleware } from "./middlewares/security.middleware.js";
import {
  errorHandler,
  notFoundHandler
} from "./middlewares/error.middleware.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", Number(process.env.TRUST_PROXY || 1));

app.use(cors(corsOptions));
app.use(securityMiddleware);
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "1mb" }));

app.get("/health", (req, res) => {
  res.status(200).json({
    service: process.env.SERVICE_NAME || "ai-service",
    status: "UP",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  });
});

app.use("/ai", aiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
