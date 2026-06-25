import * as trackingService from "../services/tracking.service.js";

export const createTrackingLog = async (req, res) => {
    try {
        const orderId = req.params.orderId || req.body.orderId;

        const trackingLog = await trackingService.createTrackingLog(
            req.user,
            orderId,
            req.body
        );

        res.status(201).json({
            success: true,
            data: trackingLog
        });
    } catch (error) {
        console.error("Create tracking log error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getCurrentLocation = async (req, res) => {
    try {
        const currentLocation = await trackingService.getCurrentLocation(
            req.params.orderId
        );

        res.status(200).json({
            success: true,
            data: currentLocation
        });
    } catch (error) {
        console.error("Get current location error:", error);

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

export const getTrackingHistory = async (req, res) => {
    try {
        const history = await trackingService.getTrackingHistory(
            req.params.orderId,
            req.query
        );

        res.status(200).json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error("Get tracking history error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getTrackingRoute = async (req, res) => {
    try {
        const route = await trackingService.getTrackingRoute(req.params.orderId);

        res.status(200).json({
            success: true,
            data: route
        });
    } catch (error) {
        console.error("Get tracking route error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};