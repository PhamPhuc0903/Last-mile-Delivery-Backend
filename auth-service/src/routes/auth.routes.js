import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);

router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

router.get("/me", authMiddleware, authController.me);
router.post("/logout", authMiddleware, authController.logout);

router.patch(
    "/change-password",
    authMiddleware,
    authController.changePassword
);

router.get(
    "/admin-test",
    authMiddleware,
    roleMiddleware("ADMIN"),
    authController.adminTest
);

export default router;