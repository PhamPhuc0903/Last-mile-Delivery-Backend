import * as notificationService from "../services/notification.service.js";

export const createNotification = async (req, res) => {
    try {
        const notification = await notificationService.createNotification(
            req.user,
            req.body
        );

        res.status(201).json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error("Create notification error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const createBulkNotifications = async (req, res) => {
    try {
        const result = await notificationService.createBulkNotifications(
            req.user,
            req.body
        );

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Create bulk notifications error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const getMyNotifications = async (req, res) => {
    try {
        const result = await notificationService.getMyNotifications(
            req.user,
            req.query
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Get my notifications error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const result = await notificationService.getUnreadCount(req.user);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Get unread count error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const getNotificationById = async (req, res) => {
    try {
        const notification = await notificationService.getNotificationById(
            req.user,
            req.params.id
        );

        res.status(200).json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error("Get notification error:", error);

        res.status(error.statusCode || 404).json({
            success: false,
            message: error.message
        });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const notification = await notificationService.markAsRead(
            req.user,
            req.params.id
        );

        res.status(200).json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error("Mark notification read error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        const result = await notificationService.markAllAsRead(req.user);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Mark all notifications read error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteNotification = async (req, res) => {
    try {
        const result = await notificationService.deleteNotification(
            req.user,
            req.params.id
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Delete notification error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};