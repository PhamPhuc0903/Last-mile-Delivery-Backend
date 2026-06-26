import express from "express";
import * as adminController from "../controllers/admin.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("ADMIN"));

router.get("/dashboard", adminController.getDashboardStats);

router.get("/system/health", adminController.getSystemHealth);

router.get("/ai/recommendations", adminController.getAiRecommendationLogs);
router.get("/ai/anomalies", adminController.getAiAnomalyLogs);

router.get("/users", adminController.getUsers);
router.post("/users", adminController.createUser);
router.get("/users/:id", adminController.getUserById);
router.patch("/users/:id", adminController.updateUser);
router.patch("/users/:id/block", adminController.blockUser);
router.patch("/users/:id/unblock", adminController.unblockUser);
router.delete("/users/:id", adminController.deleteUser);

router.get("/orders", adminController.getOrders);
router.get("/orders/:id", adminController.getOrderById);

router.get("/drivers", adminController.getDrivers);
router.get("/drivers/:id", adminController.getDriverById);
router.patch("/drivers/:id/status", adminController.updateDriverStatus);

router.get("/payments", adminController.getPayments);

export default router;