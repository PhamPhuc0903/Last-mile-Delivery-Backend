import bcrypt from "bcryptjs";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    generateResetPasswordToken,
    verifyResetPasswordToken
} from "../config/jwt.config.js";
import * as authRepository from "../repositories/auth.repository.js";

const createHttpError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const sanitizeUser = (user) => {
    return {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
    };
};

export const register = async ({ fullName, phone, email, password, role }) => {
    if (!fullName || !phone || !password) {
        throw createHttpError("fullName, phone and password are required", 400);
    }

    if (password.length < 6) {
        throw createHttpError("Password must be at least 6 characters", 400);
    }

    const existingUser = await authRepository.findUserByPhoneOrEmail({
        phone,
        email
    });

    if (existingUser) {
        throw createHttpError("Phone or email already exists", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const safeRole = role === "DRIVER" ? "DRIVER" : "CUSTOMER";

    const user = await authRepository.createUser({
        fullName,
        phone,
        email,
        passwordHash,
        role: safeRole
    });

    return sanitizeUser(user);
};

export const login = async ({ phone, email, password }) => {
    if ((!phone && !email) || !password) {
        throw createHttpError("phone/email and password are required", 400);
    }

    const user = await authRepository.findUserByPhoneOrEmail({
        phone,
        email
    });

    if (!user) {
        throw createHttpError("Invalid credentials", 401);
    }

    if (user.status !== "ACTIVE") {
        throw createHttpError("User account is not active", 403);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
        throw createHttpError("Invalid credentials", 401);
    }

    const payload = {
        id: user.id,
        role: user.role
    };

    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
        user: sanitizeUser(user)
    };
};

export const getMe = async (userId) => {
    const user = await authRepository.findUserById(userId);

    if (!user) {
        throw createHttpError("User not found", 404);
    }

    return sanitizeUser(user);
};

export const refreshToken = async (refreshTokenValue) => {
    if (!refreshTokenValue) {
        throw createHttpError("Refresh token is required", 400);
    }

    let decoded;

    try {
        decoded = verifyRefreshToken(refreshTokenValue);
    } catch {
        throw createHttpError("Invalid refresh token", 401);
    }

    const user = await authRepository.findUserById(decoded.id);

    if (!user || user.status !== "ACTIVE") {
        throw createHttpError("Invalid refresh token", 401);
    }

    const payload = {
        id: user.id,
        role: user.role
    };

    return {
        accessToken: generateAccessToken(payload)
    };
};

export const changePassword = async (userId, { oldPassword, newPassword }) => {
    if (!oldPassword || !newPassword) {
        throw createHttpError("oldPassword and newPassword are required", 400);
    }

    if (newPassword.length < 6) {
        throw createHttpError("New password must be at least 6 characters", 400);
    }

    const user = await authRepository.findUserById(userId);

    if (!user) {
        throw createHttpError("User not found", 404);
    }

    if (user.status !== "ACTIVE") {
        throw createHttpError("User account is not active", 403);
    }

    const isOldPasswordValid = await bcrypt.compare(
        oldPassword,
        user.passwordHash
    );

    if (!isOldPasswordValid) {
        throw createHttpError("Old password is incorrect", 400);
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await authRepository.updateUserPassword({
        userId,
        passwordHash: newPasswordHash
    });

    return {
        message: "Password changed successfully"
    };
};

export const logout = async () => {
    return {
        message: "Logout successfully"
    };
};

export const forgotPassword = async ({ phone, email }) => {
    if (!phone && !email) {
        throw createHttpError("phone or email is required", 400);
    }

    const user = await authRepository.findUserByPhoneOrEmail({
        phone,
        email
    });

    if (!user) {
        throw createHttpError("User not found", 404);
    }

    if (user.status !== "ACTIVE") {
        throw createHttpError("User account is not active", 403);
    }

    const resetToken = generateResetPasswordToken({
        id: user.id,
        purpose: "RESET_PASSWORD"
    });

    return {
        message: "Reset password token generated successfully",
        resetToken
    };
};

export const resetPassword = async ({ resetToken, newPassword }) => {
    if (!resetToken || !newPassword) {
        throw createHttpError("resetToken and newPassword are required", 400);
    }

    if (newPassword.length < 6) {
        throw createHttpError("New password must be at least 6 characters", 400);
    }

    let decoded;

    try {
        decoded = verifyResetPasswordToken(resetToken);
    } catch {
        throw createHttpError("Invalid reset token", 401);
    }

    if (decoded.purpose !== "RESET_PASSWORD") {
        throw createHttpError("Invalid reset token", 401);
    }

    const user = await authRepository.findUserById(decoded.id);

    if (!user) {
        throw createHttpError("User not found", 404);
    }

    if (user.status !== "ACTIVE") {
        throw createHttpError("User account is not active", 403);
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await authRepository.updateUserPassword({
        userId: user.id,
        passwordHash: newPasswordHash
    });

    return {
        message: "Password reset successfully"
    };
};