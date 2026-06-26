import * as driverService from "../services/driver.service.js";

export const getMe = async (req, res) => {
    try {
        const driver = await driverService.getMe(req.user.id);

        res.status(200).json({
            success: true,
            data: driver
        });
    } catch (error) {
        console.error("Get driver profile error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const updateMe = async (req, res) => {
    try {
        const driver = await driverService.updateMe(req.user.id, req.body);

        res.status(200).json({
            success: true,
            data: driver
        });
    } catch (error) {
        console.error("Update driver profile error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const updateMyStatus = async (req, res) => {
    try {
        const driver = await driverService.updateMyStatus(req.user.id, req.body);

        res.status(200).json({
            success: true,
            data: driver
        });
    } catch (error) {
        console.error("Update driver status error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const updateMyLocation = async (req, res) => {
    try {
        const result = await driverService.updateMyLocation(req.user.id, req.body);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Update driver location error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const getDrivers = async (req, res) => {
    try {
        const result = await driverService.getDrivers(req.query);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Get drivers error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const getNearbyDrivers = async (req, res) => {
    try {
        const drivers = await driverService.getNearbyDrivers(req.query);

        res.status(200).json({
            success: true,
            data: drivers
        });
    } catch (error) {
        console.error("Get nearby drivers error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const getDriverById = async (req, res) => {
    try {
        const driver = await driverService.getDriverById(req.params.id);

        res.status(200).json({
            success: true,
            data: driver
        });
    } catch (error) {
        console.error("Get driver error:", error);

        res.status(error.statusCode || 404).json({
            success: false,
            message: error.message
        });
    }
};

export const approveDriver = async (req, res) => {
    try {
        const driver = await driverService.approveDriver(req.params.id);

        res.status(200).json({
            success: true,
            data: driver
        });
    } catch (error) {
        console.error("Approve driver error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const rejectDriver = async (req, res) => {
    try {
        const driver = await driverService.rejectDriver(req.params.id, req.body || {});

        res.status(200).json({
            success: true,
            data: driver
        });
    } catch (error) {
        console.error("Reject driver error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};