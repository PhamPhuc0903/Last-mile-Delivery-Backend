import express from "express";
import * as paymentController from "../controllers/payment.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    uuidParamSchema,
    orderIdParamSchema,
    createPaymentSchema,
    markPaymentPaidSchema,
    markPaymentFailedSchema,
    refundPaymentSchema
} from "../validators/payment.validator.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    roleMiddleware("CUSTOMER", "ADMIN"),
    validate(createPaymentSchema),
    paymentController.createPayment
);

router.get(
    "/my-payments",
    authMiddleware,
    roleMiddleware("CUSTOMER", "ADMIN"),
    paymentController.getMyPayments
);

router.get(
    "/order/:orderId",
    authMiddleware,
    roleMiddleware("CUSTOMER", "ADMIN"),
    validate(orderIdParamSchema),
    paymentController.getPaymentsByOrderId
);

router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("CUSTOMER", "ADMIN"),
    validate(uuidParamSchema),
    paymentController.getPaymentById
);

router.patch(
    "/:id/paid",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(markPaymentPaidSchema),
    paymentController.markPaymentPaid
);

router.patch(
    "/:id/failed",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(markPaymentFailedSchema),
    paymentController.markPaymentFailed
);

router.post(
    "/:id/refund",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(refundPaymentSchema),
    paymentController.refundPayment
);

export default router;