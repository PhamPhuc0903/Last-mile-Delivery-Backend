import express from "express";
import * as notificationController from "../controllers/notification.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN"),
    notificationController.createNotification
);

router.post(
    "/push",
    authMiddleware,
    roleMiddleware("ADMIN"),
    notificationController.createNotification
);

router.post(
    "/bulk",
    authMiddleware,
    roleMiddleware("ADMIN"),
    notificationController.createBulkNotifications
);

router.post(
    "/broadcast",
    authMiddleware,
    roleMiddleware("ADMIN"),
    notificationController.createBulkNotifications
);

router.get(
    "/",
    authMiddleware,
    notificationController.getMyNotifications
);

router.get(
    "/me",
    authMiddleware,
    notificationController.getMyNotifications
);

router.get(
    "/me/unread-count",
    authMiddleware,
    notificationController.getUnreadCount
);

router.patch(
    "/me/read-all",
    authMiddleware,
    notificationController.markAllAsRead
);

router.get(
    "/:id",
    authMiddleware,
    notificationController.getNotificationById
);

router.patch(
    "/:id/read",
    authMiddleware,
    notificationController.markAsRead
);

router.delete(
    "/:id",
    authMiddleware,
    notificationController.deleteNotification
);

export default router;