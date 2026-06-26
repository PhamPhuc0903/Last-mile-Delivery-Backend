import * as adminService from "../services/admin.service.js";

export const getDashboardStats = async (req, res) => {
    try {
        const data = await adminService.getDashboardStats();

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Get dashboard stats error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getUsers = async (req, res) => {
    try {
        const data = await adminService.getUsers(req.query);

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Get users error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getUserById = async (req, res) => {
    try {
        const data = await adminService.getUserById(req.params.id);

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Get user detail error:", error);

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

export const createUser = async (req, res) => {
    try {
        const data = await adminService.createUser(req.body);

        res.status(201).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Create user error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const updateUser = async (req, res) => {
    try {
        const data = await adminService.updateUser(req.params.id, req.body);

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Update user error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const blockUser = async (req, res) => {
    try {
        const data = await adminService.blockUser(req.params.id);

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Block user error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const unblockUser = async (req, res) => {
    try {
        const data = await adminService.unblockUser(req.params.id);

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Unblock user error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const data = await adminService.deleteUser(req.params.id);

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Delete user error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getOrders = async (req, res) => {
    try {
        const data = await adminService.getOrders(req.query);

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Get admin orders error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getDrivers = async (req, res) => {
    try {
        const data = await adminService.getDrivers(req.query);

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Get admin drivers error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getPayments = async (req, res) => {
    try {
        const data = await adminService.getPayments(req.query);

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Get admin payments error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const data = await adminService.getOrderById(req.params.id);

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Get admin order detail error:", error);

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

export const getDriverById = async (req, res) => {
    try {
        const data = await adminService.getDriverById(req.params.id);

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Get admin driver detail error:", error);

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

export const updateDriverStatus = async (req, res) => {
    try {
        const data = await adminService.updateDriverStatus(
            req.params.id,
            req.body
        );

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Update admin driver status error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getAiRecommendationLogs = async (req, res) => {
    try {
        const data = await adminService.getAiRecommendationLogs(req.query);

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Get AI recommendation logs error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getAiAnomalyLogs = async (req, res) => {
    try {
        const data = await adminService.getAiAnomalyLogs(req.query);

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Get AI anomaly logs error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getSystemHealth = async (req, res) => {
    try {
        const data = await adminService.getSystemHealth();

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Get system health error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};