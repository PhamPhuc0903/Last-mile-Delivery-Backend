import express from "express";
import * as driverController from "../controllers/driver.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get(
    "/me",
    authMiddleware,
    roleMiddleware("DRIVER", "ADMIN"),
    driverController.getMe
);

router.patch(
    "/me",
    authMiddleware,
    roleMiddleware("DRIVER", "ADMIN"),
    driverController.updateMe
);

router.patch(
    "/me/status",
    authMiddleware,
    roleMiddleware("DRIVER", "ADMIN"),
    driverController.updateMyStatus
);

router.post(
    "/me/location",
    authMiddleware,
    roleMiddleware("DRIVER", "ADMIN"),
    driverController.updateMyLocation
);

router.patch(
    "/me/location",
    authMiddleware,
    roleMiddleware("DRIVER", "ADMIN"),
    driverController.updateMyLocation
);

router.get(
    "/nearby",
    authMiddleware,
    roleMiddleware("ADMIN"),
    driverController.getNearbyDrivers
);

router.get(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN"),
    driverController.getDrivers
);

router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    driverController.getDriverById
);

router.patch(
    "/:id/approve",
    authMiddleware,
    roleMiddleware("ADMIN"),
    driverController.approveDriver
);

router.patch(
    "/:id/reject",
    authMiddleware,
    roleMiddleware("ADMIN"),
    driverController.rejectDriver
);

export default router;