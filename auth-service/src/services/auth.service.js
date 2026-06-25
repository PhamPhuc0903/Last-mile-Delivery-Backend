import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    generateResetPasswordToken,
    verifyResetPasswordToken
} from "../config/jwt.config.js";

export const register = async ({ fullName, phone, email, password, role }) => {
    if (!fullName || !phone || !password) {
        throw new Error("fullName, phone and password are required");
    }

    const conditions = [{ phone }];

    if (email) {
        conditions.push({ email });
    }

    const existingUser = await prisma.user.findFirst({
        where: {
            OR: conditions
        }
    });

    if (existingUser) {
        throw new Error("Phone or email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            fullName,
            phone,
            email: email || null,
            passwordHash,
            role: role || "CUSTOMER"
        }
    });

    return {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        role: user.role
    };
};

export const login = async ({ phone, email, password }) => {
    if ((!phone && !email) || !password) {
        throw new Error("phone/email and password are required");
    }

    const conditions = [];

    if (phone) {
        conditions.push({ phone });
    }

    if (email) {
        conditions.push({ email });
    }

    const user = await prisma.user.findFirst({
        where: {
            OR: conditions
        }
    });

    if (!user) {
        throw new Error("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
        throw new Error("Invalid credentials");
    }

    const payload = {
        id: user.id,
        role: user.role
    };

    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
        user: {
            id: user.id,
            fullName: user.fullName,
            phone: user.phone,
            email: user.email,
            role: user.role
        }
    };
};

export const getMe = async (userId) => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        }
    });

    if (!user) {
        throw new Error("User not found");
    }

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

export const refreshToken = async (refreshTokenValue) => {
    if (!refreshTokenValue) {
        throw new Error("Refresh token is required");
    }

    const decoded = verifyRefreshToken(refreshTokenValue);

    const user = await prisma.user.findUnique({
        where: {
            id: decoded.id
        }
    });

    if (!user || user.status !== "ACTIVE") {
        throw new Error("Invalid refresh token");
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
        throw new Error("oldPassword and newPassword are required");
    }

    if (newPassword.length < 6) {
        throw new Error("New password must be at least 6 characters");
    }

    const user = await prisma.user.findUnique({
        where: {
            id: userId
        }
    });

    if (!user) {
        throw new Error("User not found");
    }

    const isOldPasswordValid = await bcrypt.compare(
        oldPassword,
        user.passwordHash
    );

    if (!isOldPasswordValid) {
        throw new Error("Old password is incorrect");
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: {
            id: userId
        },
        data: {
            passwordHash: newPasswordHash
        }
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
        throw new Error("phone or email is required");
    }

    const conditions = [];

    if (phone) {
        conditions.push({ phone });
    }

    if (email) {
        conditions.push({ email });
    }

    const user = await prisma.user.findFirst({
        where: {
            OR: conditions
        }
    });

    if (!user) {
        throw new Error("User not found");
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
        throw new Error("resetToken and newPassword are required");
    }

    if (newPassword.length < 6) {
        throw new Error("New password must be at least 6 characters");
    }

    const decoded = verifyResetPasswordToken(resetToken);

    if (decoded.purpose !== "RESET_PASSWORD") {
        throw new Error("Invalid reset token");
    }

    const user = await prisma.user.findUnique({
        where: {
            id: decoded.id
        }
    });

    if (!user) {
        throw new Error("User not found");
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: {
            id: user.id
        },
        data: {
            passwordHash: newPasswordHash
        }
    });

    return {
        message: "Password reset successfully"
    };
};