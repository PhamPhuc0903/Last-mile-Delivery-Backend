import prisma from "../config/prisma.js";

const NOTIFICATION_TYPES = [
    "ORDER",
    "PAYMENT",
    "DRIVER",
    "DISPATCH",
    "SYSTEM",
    "PROMOTION"
];

const NOTIFICATION_CHANNELS = ["IN_APP", "EMAIL", "SMS", "PUSH"];

export const createNotification = async (data) => {
    const {
        userId,
        title,
        message,
        type,
        channel,
        metadata
    } = data;

    if (!userId || !title || !message) {
        throw new Error("userId, title and message are required");
    }

    const finalType = type || "SYSTEM";
    const finalChannel = channel || "IN_APP";

    if (!NOTIFICATION_TYPES.includes(finalType)) {
        throw new Error("Invalid notification type");
    }

    if (!NOTIFICATION_CHANNELS.includes(finalChannel)) {
        throw new Error("Invalid notification channel");
    }

    return prisma.notification.create({
        data: {
            userId,
            title,
            message,
            type: finalType,
            channel: finalChannel,
            metadata: metadata || null
        }
    });
};

export const createBulkNotifications = async (data) => {
    const {
        userIds,
        title,
        message,
        type,
        channel,
        metadata
    } = data;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        throw new Error("userIds must be a non-empty array");
    }

    if (!title || !message) {
        throw new Error("title and message are required");
    }

    const finalType = type || "SYSTEM";
    const finalChannel = channel || "IN_APP";

    if (!NOTIFICATION_TYPES.includes(finalType)) {
        throw new Error("Invalid notification type");
    }

    if (!NOTIFICATION_CHANNELS.includes(finalChannel)) {
        throw new Error("Invalid notification channel");
    }

    await prisma.notification.createMany({
        data: userIds.map((userId) => ({
            userId,
            title,
            message,
            type: finalType,
            channel: finalChannel,
            metadata: metadata || null
        }))
    });

    return {
        message: "Bulk notifications created successfully",
        count: userIds.length
    };
};

export const getMyNotifications = async (userId, query) => {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    const where = {
        userId
    };

    if (query.status) {
        where.status = query.status;
    }

    if (query.type) {
        where.type = query.type;
    }

    const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
            where,
            orderBy: {
                createdAt: "desc"
            },
            skip,
            take: limit
        }),
        prisma.notification.count({
            where
        })
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

export const getUnreadCount = async (userId) => {
    const count = await prisma.notification.count({
        where: {
            userId,
            status: "UNREAD"
        }
    });

    return {
        unreadCount: count
    };
};

export const getNotificationById = async (user, notificationId) => {
    const where =
        user.role === "ADMIN"
            ? {
                id: notificationId
            }
            : {
                id: notificationId,
                userId: user.id
            };

    const notification = await prisma.notification.findFirst({
        where
    });

    if (!notification) {
        throw new Error("Notification not found");
    }

    return notification;
};

export const markAsRead = async (user, notificationId) => {
    const notification = await getNotificationById(user, notificationId);

    return prisma.notification.update({
        where: {
            id: notification.id
        },
        data: {
            status: "READ",
            readAt: new Date(),
            updatedAt: new Date()
        }
    });
};

export const markAllAsRead = async (userId) => {
    const result = await prisma.notification.updateMany({
        where: {
            userId,
            status: "UNREAD"
        },
        data: {
            status: "READ",
            readAt: new Date(),
            updatedAt: new Date()
        }
    });

    return {
        message: "All notifications marked as read",
        count: result.count
    };
};

export const deleteNotification = async (user, notificationId) => {
    const notification = await getNotificationById(user, notificationId);

    await prisma.notification.delete({
        where: {
            id: notification.id
        }
    });

    return {
        message: "Notification deleted successfully"
    };
};