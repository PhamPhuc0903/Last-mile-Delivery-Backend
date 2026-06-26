import * as dispatchService from "../services/dispatch.service.js";

export const createAssignment = async (req, res) => {
    try {
        const assignment = await dispatchService.createAssignment(
            req.user,
            req.body
        );

        res.status(201).json({
            success: true,
            data: assignment
        });
    } catch (error) {
        console.error("Create assignment error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const autoAssign = async (req, res) => {
    try {
        const result = await dispatchService.autoAssign(
            req.user,
            req.body,
            req.headers.authorization
        );

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Auto assign error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const getAssignments = async (req, res) => {
    try {
        const result = await dispatchService.getAssignments(
            req.user,
            req.query
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Get assignments error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const getMyAssignments = async (req, res) => {
    try {
        const assignments = await dispatchService.getMyAssignments(req.user.id);

        res.status(200).json({
            success: true,
            data: assignments
        });
    } catch (error) {
        console.error("Get my assignments error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const getMyCurrentAssignment = async (req, res) => {
    try {
        const assignment = await dispatchService.getMyCurrentAssignment(req.user.id);

        res.status(200).json({
            success: true,
            data: assignment
        });
    } catch (error) {
        console.error("Get my current assignment error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const getMyHistory = async (req, res) => {
    try {
        const assignments = await dispatchService.getMyHistory(req.user.id);

        res.status(200).json({
            success: true,
            data: assignments
        });
    } catch (error) {
        console.error("Get my history error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const getAssignmentById = async (req, res) => {
    try {
        const assignment = await dispatchService.getAssignmentById(
            req.user,
            req.params.id
        );

        res.status(200).json({
            success: true,
            data: assignment
        });
    } catch (error) {
        console.error("Get assignment error:", error);

        res.status(error.statusCode || 404).json({
            success: false,
            message: error.message
        });
    }
};

export const acceptAssignment = async (req, res) => {
    try {
        const assignment = await dispatchService.acceptAssignment(
            req.user,
            req.params.id
        );

        res.status(200).json({
            success: true,
            data: assignment
        });
    } catch (error) {
        console.error("Accept assignment error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const rejectAssignment = async (req, res) => {
    try {
        const assignment = await dispatchService.rejectAssignment(
            req.user,
            req.params.id,
            req.body || {}
        );

        res.status(200).json({
            success: true,
            data: assignment
        });
    } catch (error) {
        console.error("Reject assignment error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const cancelAssignment = async (req, res) => {
    try {
        const assignment = await dispatchService.cancelAssignment(
            req.user,
            req.params.id,
            req.body || {}
        );

        res.status(200).json({
            success: true,
            data: assignment
        });
    } catch (error) {
        console.error("Cancel assignment error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const completeAssignment = async (req, res) => {
    try {
        const assignment = await dispatchService.completeAssignment(
            req.user,
            req.params.id,
            req.body || {}
        );

        res.status(200).json({
            success: true,
            data: assignment
        });
    } catch (error) {
        console.error("Complete assignment error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};