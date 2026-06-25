import express from "express";
import * as userController from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/me", authMiddleware, userController.getMe);
router.patch("/me", authMiddleware, userController.updateMe);

router.get("/me/addresses", authMiddleware, userController.getAddresses);
router.post("/me/addresses", authMiddleware, userController.createAddress);

router.get("/me/addresses/:id", authMiddleware, userController.getAddressById);
router.patch("/me/addresses/:id", authMiddleware, userController.updateAddress);
router.delete(
    "/me/addresses/:id",
    authMiddleware,
    userController.deleteAddress
);

export default router;