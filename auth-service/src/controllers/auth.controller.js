import * as authService from "../services/auth.service.js";

export const register = async (req, res) => {
    try {
        const user = await authService.register(req.body);

        res.status(201).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const login = async (req, res) => {
    try {
        const result = await authService.login(req.body);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

export const me = async (req, res) => {
    try {
        const user = await authService.getMe(req.user.id);

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error("Get me error:", error);

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        const result = await authService.refreshToken(refreshToken);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Refresh token error:", error);

        res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

export const changePassword = async (req, res) => {
    try {
        const result = await authService.changePassword(req.user.id, req.body);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Change password error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const logout = async (req, res) => {
    try {
        const result = await authService.logout();

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Logout error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const adminTest = async (req, res) => {
    res.status(200).json({
        success: true,
        message: "Admin route access granted",
        user: req.user
    });
};

export const forgotPassword = async (req, res) => {
    try {
        const result = await authService.forgotPassword(req.body);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Forgot password error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const result = await authService.resetPassword(req.body);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Reset password error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};