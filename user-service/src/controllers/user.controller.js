import * as userService from "../services/user.service.js";

export const getMe = async (req, res) => {
    try {
        const profile = await userService.getMe(req.user.id);

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error("Get profile error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const updateMe = async (req, res) => {
    try {
        const profile = await userService.updateMe(req.user.id, req.body);

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error("Update profile error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getAddresses = async (req, res) => {
    try {
        const addresses = await userService.getAddresses(req.user.id);

        res.status(200).json({
            success: true,
            data: addresses
        });
    } catch (error) {
        console.error("Get addresses error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const createAddress = async (req, res) => {
    try {
        const address = await userService.createAddress(req.user.id, req.body);

        res.status(201).json({
            success: true,
            data: address
        });
    } catch (error) {
        console.error("Create address error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getAddressById = async (req, res) => {
    try {
        const address = await userService.getAddressById(
            req.user.id,
            req.params.id
        );

        res.status(200).json({
            success: true,
            data: address
        });
    } catch (error) {
        console.error("Get address error:", error);

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

export const updateAddress = async (req, res) => {
    try {
        const address = await userService.updateAddress(
            req.user.id,
            req.params.id,
            req.body
        );

        res.status(200).json({
            success: true,
            data: address
        });
    } catch (error) {
        console.error("Update address error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteAddress = async (req, res) => {
    try {
        const result = await userService.deleteAddress(req.user.id, req.params.id);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Delete address error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};