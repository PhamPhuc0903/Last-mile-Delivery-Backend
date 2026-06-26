import helmet from "helmet";
import rateLimit from "express-rate-limit";

const parseAllowedOrigins = () => {
  const rawOrigins = process.env.CORS_ORIGIN || "*";

  return rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = parseAllowedOrigins();

    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

export const securityMiddleware = [
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false
  }),

  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX || 300),
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === "/health",
    handler: (req, res) => {
      return res.status(429).json({
        success: false,
        message: "Too many requests, please try again later"
      });
    }
  })
];
