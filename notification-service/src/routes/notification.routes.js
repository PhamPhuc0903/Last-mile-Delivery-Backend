import express from "express";
import * as notificationController from "../controllers/notification.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    notificationIdParamSchema,
    createNotificationSchema,
    createBulkNotificationsSchema
} from "../validators/notification.validator.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(createNotificationSchema),
    notificationController.createNotification
);

router.post(
    "/push",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(createNotificationSchema),
    notificationController.createNotification
);

router.post(
    "/bulk",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(createBulkNotificationsSchema),
    notificationController.createBulkNotifications
);

router.post(
    "/broadcast",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(createBulkNotificationsSchema),
    notificationController.createBulkNotifications
);

router.get(
    "/",
    authMiddleware,
    roleMiddleware("CUSTOMER", "DRIVER", "ADMIN"),
    notificationController.getMyNotifications
);

router.get(
    "/me",
    authMiddleware,
    roleMiddleware("CUSTOMER", "DRIVER", "ADMIN"),
    notificationController.getMyNotifications
);

router.get(
    "/me/unread-count",
    authMiddleware,
    roleMiddleware("CUSTOMER", "DRIVER", "ADMIN"),
    notificationController.getUnreadCount
);

router.patch(
    "/me/read-all",
    authMiddleware,
    roleMiddleware("CUSTOMER", "DRIVER", "ADMIN"),
    notificationController.markAllAsRead
);

router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("CUSTOMER", "DRIVER", "ADMIN"),
    validate(notificationIdParamSchema),
    notificationController.getNotificationById
);

router.patch(
    "/:id/read",
    authMiddleware,
    roleMiddleware("CUSTOMER", "DRIVER", "ADMIN"),
    validate(notificationIdParamSchema),
    notificationController.markAsRead
);

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("CUSTOMER", "DRIVER", "ADMIN"),
    validate(notificationIdParamSchema),
    notificationController.deleteNotification
);

export default router;