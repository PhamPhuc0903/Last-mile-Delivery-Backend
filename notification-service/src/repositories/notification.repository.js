import prisma from "../config/prisma.js";

export const createNotification = async (data) => {
    return prisma.notification.create({
        data
    });
};

export const createManyNotifications = async (data) => {
    return prisma.notification.createMany({
        data
    });
};

export const findNotifications = async ({ where, skip, limit }) => {
    return prisma.notification.findMany({
        where,
        orderBy: {
            createdAt: "desc"
        },
        skip,
        take: limit
    });
};

export const countNotifications = async (where) => {
    return prisma.notification.count({
        where
    });
};

export const countUnreadByUserId = async (userId) => {
    return prisma.notification.count({
        where: {
            userId,
            status: "UNREAD"
        }
    });
};

export const findNotificationById = async (notificationId) => {
    return prisma.notification.findUnique({
        where: {
            id: notificationId
        }
    });
};

export const markNotificationAsRead = async (notificationId) => {
    return prisma.notification.update({
        where: {
            id: notificationId
        },
        data: {
            status: "READ",
            readAt: new Date(),
            updatedAt: new Date()
        }
    });
};

export const markAllNotificationsAsReadByUserId = async (userId) => {
    return prisma.notification.updateMany({
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
};

export const deleteNotificationById = async (notificationId) => {
    return prisma.notification.delete({
        where: {
            id: notificationId
        }
    });
};