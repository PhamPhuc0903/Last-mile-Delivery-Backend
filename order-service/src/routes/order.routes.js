import express from "express";
import * as orderController from "../controllers/order.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get(
    "/stats/today",
    authMiddleware,
    roleMiddleware("ADMIN"),
    orderController.getTodayStats
);

router.get(
    "/stats/month",
    authMiddleware,
    roleMiddleware("ADMIN"),
    orderController.getMonthStats
);

router.get(
    "/stats/year",
    authMiddleware,
    roleMiddleware("ADMIN"),
    orderController.getYearStats
);

router.post(
    "/",
    authMiddleware,
    roleMiddleware("CUSTOMER", "ADMIN"),
    orderController.createOrder
);

router.get(
    "/",
    authMiddleware,
    orderController.getOrders
);

router.get(
    "/my-orders",
    authMiddleware,
    roleMiddleware("CUSTOMER", "ADMIN"),
    orderController.getMyOrders
);

router.get(
    "/:id/timeline",
    authMiddleware,
    orderController.getOrderTimeline
);

router.get(
    "/:id",
    authMiddleware,
    orderController.getOrderById
);

router.patch(
    "/:id",
    authMiddleware,
    roleMiddleware("CUSTOMER", "ADMIN"),
    orderController.updateOrder
);

router.patch(
    "/:id/cancel",
    authMiddleware,
    roleMiddleware("CUSTOMER", "ADMIN"),
    orderController.cancelOrder
);

router.patch(
    "/:id/status",
    authMiddleware,
    roleMiddleware("ADMIN"),
    orderController.updateOrderStatus
);

export default router;