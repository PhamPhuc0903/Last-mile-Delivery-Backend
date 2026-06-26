import express from "express";
import * as adminController from "../controllers/admin.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    uuidParamSchema,
    createUserSchema,
    updateUserSchema,
    updateDriverStatusSchema
} from "../validators/admin.validator.js";

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("ADMIN"));

router.get("/dashboard", adminController.getDashboardStats);

router.get("/system/health", adminController.getSystemHealth);

router.get("/ai/recommendations", adminController.getAiRecommendationLogs);
router.get("/ai/anomalies", adminController.getAiAnomalyLogs);

router.get("/users", adminController.getUsers);

router.post(
    "/users",
    validate(createUserSchema),
    adminController.createUser
);

router.get(
    "/users/:id",
    validate(uuidParamSchema),
    adminController.getUserById
);

router.patch(
    "/users/:id",
    validate(updateUserSchema),
    adminController.updateUser
);

router.patch(
    "/users/:id/block",
    validate(uuidParamSchema),
    adminController.blockUser
);

router.patch(
    "/users/:id/unblock",
    validate(uuidParamSchema),
    adminController.unblockUser
);

router.delete(
    "/users/:id",
    validate(uuidParamSchema),
    adminController.deleteUser
);

router.get("/orders", adminController.getOrders);

router.get(
    "/orders/:id",
    validate(uuidParamSchema),
    adminController.getOrderById
);

router.get("/drivers", adminController.getDrivers);

router.get(
    "/drivers/:id",
    validate(uuidParamSchema),
    adminController.getDriverById
);

router.patch(
    "/drivers/:id/status",
    validate(updateDriverStatusSchema),
    adminController.updateDriverStatus
);

router.get("/payments", adminController.getPayments);

export default router;