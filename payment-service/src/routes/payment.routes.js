import express from "express";
import * as paymentController from "../controllers/payment.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    roleMiddleware("CUSTOMER", "ADMIN"),
    paymentController.createPayment
);

router.get(
    "/my-payments",
    authMiddleware,
    paymentController.getMyPayments
);

router.get(
    "/order/:orderId",
    authMiddleware,
    paymentController.getPaymentsByOrderId
);

router.get(
    "/:id",
    authMiddleware,
    paymentController.getPaymentById
);

router.patch(
    "/:id/paid",
    authMiddleware,
    roleMiddleware("ADMIN"),
    paymentController.markPaymentPaid
);

router.patch(
    "/:id/failed",
    authMiddleware,
    roleMiddleware("ADMIN"),
    paymentController.markPaymentFailed
);

router.post(
    "/:id/refund",
    authMiddleware,
    roleMiddleware("ADMIN"),
    paymentController.refundPayment
);

export default router;