import express from "express";
import * as orderController from "../controllers/order.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    uuidParamSchema,
    createOrderSchema,
    updateOrderSchema,
    updateOrderStatusSchema,
    cancelOrderSchema
} from "../validators/order.validator.js";

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
    validate(createOrderSchema),
    orderController.createOrder
);

// List toàn bộ orders: nên chỉ ADMIN
router.get(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN"),
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
    roleMiddleware("CUSTOMER", "DRIVER", "ADMIN"),
    validate(uuidParamSchema),
    orderController.getOrderTimeline
);

router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("CUSTOMER", "DRIVER", "ADMIN"),
    validate(uuidParamSchema),
    orderController.getOrderById
);

router.patch(
    "/:id",
    authMiddleware,
    roleMiddleware("CUSTOMER", "ADMIN"),
    validate(updateOrderSchema),
    orderController.updateOrder
);

router.patch(
    "/:id/cancel",
    authMiddleware,
    roleMiddleware("CUSTOMER", "ADMIN"),
    validate(cancelOrderSchema),
    orderController.cancelOrder
);

router.patch(
    "/:id/status",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(updateOrderStatusSchema),
    orderController.updateOrderStatus
);

export default router;