import express from "express";
import * as userController from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    addressIdParamSchema,
    updateProfileSchema,
    createAddressSchema,
    updateAddressSchema
} from "../validators/user.validator.js";

const router = express.Router();

router.get("/me", authMiddleware, userController.getMe);

router.patch(
    "/me",
    authMiddleware,
    validate(updateProfileSchema),
    userController.updateMe
);

router.get("/me/addresses", authMiddleware, userController.getAddresses);

router.post(
    "/me/addresses",
    authMiddleware,
    validate(createAddressSchema),
    userController.createAddress
);

router.get(
    "/me/addresses/:id",
    authMiddleware,
    validate(addressIdParamSchema),
    userController.getAddressById
);

router.patch(
    "/me/addresses/:id",
    authMiddleware,
    validate(updateAddressSchema),
    userController.updateAddress
);

router.delete(
    "/me/addresses/:id",
    authMiddleware,
    validate(addressIdParamSchema),
    userController.deleteAddress
);

export default router;