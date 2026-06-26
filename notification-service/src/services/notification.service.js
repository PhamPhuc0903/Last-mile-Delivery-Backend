import * as notificationRepository from "../repositories/notification.repository.js";

const NOTIFICATION_TYPES = [
    "ORDER",
    "PAYMENT",
    "DRIVER",
    "DISPATCH",
    "SYSTEM",
    "PROMOTION"
];

const NOTIFICATION_CHANNELS = ["IN_APP", "EMAIL", "SMS", "PUSH"];

const NOTIFICATION_STATUSES = ["UNREAD", "READ"];

const createHttpError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const isAdmin = (user) => user?.role === "ADMIN";

const assertAdmin = (user) => {
    if (!isAdmin(user)) {
        throw createHttpError("Only admin can perform this action", 403);
    }
};

const assertCanAccessNotification = (notification, user) => {
    if (!notification) {
        throw createHttpError("Notification not found", 404);
    }

    if (isAdmin(user)) {
        return;
    }

    if (notification.userId === user.id) {
        return;
    }

    throw createHttpError("Forbidden", 403);
};

export const createNotification = async (user, data) => {
    assertAdmin(user);

    const { userId, title, message, type, channel, metadata } = data;

    if (!userId || !title || !message) {
        throw createHttpError("userId, title and message are required", 400);
    }

    const finalType = type || "SYSTEM";
    const finalChannel = channel || "IN_APP";

    if (!NOTIFICATION_TYPES.includes(finalType)) {
        throw createHttpError("Invalid notification type", 400);
    }

    if (!NOTIFICATION_CHANNELS.includes(finalChannel)) {
        throw createHttpError("Invalid notification channel", 400);
    }

    return notificationRepository.createNotification({
        userId,
        title,
        message,
        type: finalType,
        channel: finalChannel,
        metadata: metadata || null
    });
};

export const createBulkNotifications = async (user, data) => {
    assertAdmin(user);

    const { userIds, title, message, type, channel, metadata } = data;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        throw createHttpError("userIds must be a non-empty array", 400);
    }

    if (!title || !message) {
        throw createHttpError("title and message are required", 400);
    }

    const finalType = type || "SYSTEM";
    const finalChannel = channel || "IN_APP";

    if (!NOTIFICATION_TYPES.includes(finalType)) {
        throw createHttpError("Invalid notification type", 400);
    }

    if (!NOTIFICATION_CHANNELS.includes(finalChannel)) {
        throw createHttpError("Invalid notification channel", 400);
    }

    await notificationRepository.createManyNotifications(
        userIds.map((userId) => ({
            userId,
            title,
            message,
            type: finalType,
            channel: finalChannel,
            metadata: metadata || null
        }))
    );

    return {
        message: "Bulk notifications created successfully",
        count: userIds.length
    };
};

export const getMyNotifications = async (user, query = {}) => {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Math.min(Number(query.limit), 100) : 10;
    const skip = (page - 1) * limit;

    const where = {
        userId: user.id
    };

    if (query.status) {
        if (!NOTIFICATION_STATUSES.includes(query.status)) {
            throw createHttpError("Invalid notification status", 400);
        }

        where.status = query.status;
    }

    if (query.type) {
        if (!NOTIFICATION_TYPES.includes(query.type)) {
            throw createHttpError("Invalid notification type", 400);
        }

        where.type = query.type;
    }

    const [notifications, total] = await Promise.all([
        notificationRepository.findNotifications({
            where,
            skip,
            limit
        }),
        notificationRepository.countNotifications(where)
    ]);

    return {
        items: notifications,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const getUnreadCount = async (user) => {
    const count = await notificationRepository.countUnreadByUserId(user.id);

    return {
        unreadCount: count
    };
};

export const getNotificationById = async (user, notificationId) => {
    const notification = await notificationRepository.findNotificationById(
        notificationId
    );

    assertCanAccessNotification(notification, user);

    return notification;
};

export const markAsRead = async (user, notificationId) => {
    const notification = await getNotificationById(user, notificationId);

    return notificationRepository.markNotificationAsRead(notification.id);
};

export const markAllAsRead = async (user) => {
    const result = await notificationRepository.markAllNotificationsAsReadByUserId(
        user.id
    );

    return {
        message: "All notifications marked as read",
        count: result.count
    };
};

export const deleteNotification = async (user, notificationId) => {
    const notification = await getNotificationById(user, notificationId);

    await notificationRepository.deleteNotificationById(notification.id);

    return {
        message: "Notification deleted successfully"
    };
};