import express from "express";
import * as driverController from "../controllers/driver.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    driverIdParamSchema,
    updateDriverProfileSchema,
    updateDriverStatusSchema,
    updateDriverLocationSchema,
    nearbyDriversQuerySchema,
    rejectDriverSchema
} from "../validators/driver.validator.js";

const router = express.Router();

router.get(
    "/me",
    authMiddleware,
    roleMiddleware("DRIVER"),
    driverController.getMe
);

router.patch(
    "/me",
    authMiddleware,
    roleMiddleware("DRIVER"),
    validate(updateDriverProfileSchema),
    driverController.updateMe
);

router.patch(
    "/me/status",
    authMiddleware,
    roleMiddleware("DRIVER"),
    validate(updateDriverStatusSchema),
    driverController.updateMyStatus
);

router.post(
    "/me/location",
    authMiddleware,
    roleMiddleware("DRIVER"),
    validate(updateDriverLocationSchema),
    driverController.updateMyLocation
);

router.patch(
    "/me/location",
    authMiddleware,
    roleMiddleware("DRIVER"),
    validate(updateDriverLocationSchema),
    driverController.updateMyLocation
);

router.get(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN"),
    driverController.getDrivers
);

router.get(
    "/nearby",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(nearbyDriversQuerySchema),
    driverController.getNearbyDrivers
);

router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(driverIdParamSchema),
    driverController.getDriverById
);

router.patch(
    "/:id/approve",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(driverIdParamSchema),
    driverController.approveDriver
);

router.patch(
    "/:id/reject",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(rejectDriverSchema),
    driverController.rejectDriver
);

export default router;