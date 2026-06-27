import express from "express";
import * as trackingController from "../controllers/tracking.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    orderIdParamSchema,
    createTrackingLocationSchema,
    createOrderTrackingLocationSchema
} from "../validators/tracking.validator.js";

const router = express.Router();

router.post(
    "/location",
    authMiddleware,
    roleMiddleware("DRIVER", "ADMIN"),
    validate(createTrackingLocationSchema),
    trackingController.createTrackingLog
);

router.post(
    "/orders/:orderId/location",
    authMiddleware,
    roleMiddleware("DRIVER", "ADMIN"),
    validate(createOrderTrackingLocationSchema),
    trackingController.createTrackingLog
);

router.get(
    "/orders/:orderId",
    authMiddleware,
    roleMiddleware("CUSTOMER", "DRIVER", "ADMIN"),
    validate(orderIdParamSchema),
    trackingController.getCurrentLocation
);

router.get(
    "/orders/:orderId/current",
    authMiddleware,
    roleMiddleware("CUSTOMER", "DRIVER", "ADMIN"),
    validate(orderIdParamSchema),
    trackingController.getCurrentLocation
);

router.get(
    "/orders/:orderId/history",
    authMiddleware,
    roleMiddleware("CUSTOMER", "DRIVER", "ADMIN"),
    validate(orderIdParamSchema),
    trackingController.getTrackingHistory
);

router.get(
    "/orders/:orderId/route",
    authMiddleware,
    roleMiddleware("CUSTOMER", "DRIVER", "ADMIN"),
    validate(orderIdParamSchema),
    trackingController.getTrackingRoute
);

export default router;