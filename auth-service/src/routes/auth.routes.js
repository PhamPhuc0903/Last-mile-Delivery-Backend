import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema
} from "../validators/auth.validator.js";

const router = express.Router();

router.post("/register", validate(registerSchema), authController.register);

router.post("/login", validate(loginSchema), authController.login);

router.post(
    "/refresh-token",
    validate(refreshTokenSchema),
    authController.refreshToken
);

router.post(
    "/forgot-password",
    validate(forgotPasswordSchema),
    authController.forgotPassword
);

router.post(
    "/reset-password",
    validate(resetPasswordSchema),
    authController.resetPassword
);

router.get("/me", authMiddleware, authController.me);

router.post("/logout", authMiddleware, authController.logout);

router.patch(
    "/change-password",
    authMiddleware,
    validate(changePasswordSchema),
    authController.changePassword
);

router.get(
    "/admin-test",
    authMiddleware,
    roleMiddleware("ADMIN"),
    authController.adminTest
);

export default router;