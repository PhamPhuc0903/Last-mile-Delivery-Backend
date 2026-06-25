import express from "express";
import { createServiceProxy } from "../utils/proxy.js";

const router = express.Router();

router.use("/auth", createServiceProxy(process.env.AUTH_SERVICE_URL));

router.use("/users", createServiceProxy(process.env.USER_SERVICE_URL));

router.use("/orders", createServiceProxy(process.env.ORDER_SERVICE_URL));

router.use("/payments", createServiceProxy(process.env.PAYMENT_SERVICE_URL));

router.use("/drivers", createServiceProxy(process.env.DRIVER_SERVICE_URL));

router.use("/tracking", createServiceProxy(process.env.TRACKING_SERVICE_URL));

router.use("/dispatch", createServiceProxy(process.env.DISPATCH_SERVICE_URL));

router.use(
    "/notifications",
    createServiceProxy(process.env.NOTIFICATION_SERVICE_URL)
);

router.use("/ai", createServiceProxy(process.env.AI_SERVICE_URL));

router.use("/chatbot", createServiceProxy(process.env.CHATBOT_SERVICE_URL));

export default router;