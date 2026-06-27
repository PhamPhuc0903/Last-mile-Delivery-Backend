import express from "express";
import { createServiceProxy } from "../utils/proxy.js";

const router = express.Router();

router.use(
    "/auth",
    createServiceProxy(process.env.AUTH_SERVICE_URL || "http://localhost:3001")
);

router.use(
    "/users",
    createServiceProxy(process.env.USER_SERVICE_URL || "http://localhost:3008")
);

router.use(
    "/orders",
    createServiceProxy(process.env.ORDER_SERVICE_URL || "http://localhost:3002")
);

router.use(
    "/payments",
    createServiceProxy(process.env.PAYMENT_SERVICE_URL || "http://localhost:3011")
);

router.use(
    "/drivers",
    createServiceProxy(process.env.DRIVER_SERVICE_URL || "http://localhost:3003")
);

router.use(
    "/tracking",
    createServiceProxy(process.env.TRACKING_SERVICE_URL || "http://localhost:3004")
);

router.use(
    "/dispatch",
    createServiceProxy(process.env.DISPATCH_SERVICE_URL || "http://localhost:3005")
);

router.use(
    "/notifications",
    createServiceProxy(
        process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3006"
    )
);

router.use(
    "/ai",
    createServiceProxy(process.env.AI_SERVICE_URL || "http://localhost:3007")
);

router.use(
    "/chatbot",
    createServiceProxy(process.env.CHATBOT_SERVICE_URL || "http://localhost:3010")
);

router.use(
    "/admin",
    createServiceProxy(process.env.ADMIN_SERVICE_URL || "http://localhost:3009")
);

export default router;