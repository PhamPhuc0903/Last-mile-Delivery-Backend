import prisma from "../config/prisma.js";

export const findUserByPhoneOrEmail = async ({ phone, email }) => {
    const conditions = [];

    if (phone) {
        conditions.push({ phone });
    }

    if (email) {
        conditions.push({ email });
    }

    if (conditions.length === 0) {
        return null;
    }

    return prisma.user.findFirst({
        where: {
            OR: conditions
        }
    });
};

export const findUserById = async (userId) => {
    return prisma.user.findUnique({
        where: {
            id: userId
        }
    });
};

export const createUser = async ({
                                     fullName,
                                     phone,
                                     email,
                                     passwordHash,
                                     role
                                 }) => {
    return prisma.user.create({
        data: {
            fullName,
            phone,
            email: email || null,
            passwordHash,
            role
        }
    });
};

export const updateUserPassword = async ({ userId, passwordHash }) => {
    return prisma.user.update({
        where: {
            id: userId
        },
        data: {
            passwordHash,
            updatedAt: new Date()
        }
    });
};