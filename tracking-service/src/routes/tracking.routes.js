import express from "express";
import * as trackingController from "../controllers/tracking.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post(
    "/location",
    authMiddleware,
    roleMiddleware("DRIVER", "ADMIN"),
    trackingController.createTrackingLog
);

router.post(
    "/orders/:orderId/location",
    authMiddleware,
    roleMiddleware("DRIVER", "ADMIN"),
    trackingController.createTrackingLog
);

router.get(
    "/orders/:orderId/history",
    authMiddleware,
    roleMiddleware("CUSTOMER", "DRIVER", "ADMIN"),
    trackingController.getTrackingHistory
);

router.get(
    "/orders/:orderId/route",
    authMiddleware,
    roleMiddleware("CUSTOMER", "DRIVER", "ADMIN"),
    trackingController.getTrackingRoute
);

router.get(
    "/orders/:orderId/current",
    authMiddleware,
    roleMiddleware("CUSTOMER", "DRIVER", "ADMIN"),
    trackingController.getCurrentLocation
);

router.get(
    "/orders/:orderId",
    authMiddleware,
    roleMiddleware("CUSTOMER", "DRIVER", "ADMIN"),
    trackingController.getCurrentLocation
);

export default router;