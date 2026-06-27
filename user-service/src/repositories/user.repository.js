import prisma from "../config/prisma.js";

export const findProfileByUserId = async (userId) => {
    return prisma.profile.findUnique({
        where: {
            userId
        }
    });
};

export const createProfile = async (userId) => {
    return prisma.profile.create({
        data: {
            userId
        }
    });
};

export const upsertProfile = async ({ userId, fullName, avatarUrl }) => {
    return prisma.profile.upsert({
        where: {
            userId
        },
        update: {
            fullName,
            avatarUrl,
            updatedAt: new Date()
        },
        create: {
            userId,
            fullName,
            avatarUrl
        }
    });
};

export const findAddressesByUserId = async (userId) => {
    return prisma.address.findMany({
        where: {
            userId
        },
        orderBy: {
            createdAt: "desc"
        }
    });
};

export const clearDefaultAddresses = async (userId) => {
    return prisma.address.updateMany({
        where: {
            userId
        },
        data: {
            isDefault: false
        }
    });
};

export const createAddress = async ({
                                        userId,
                                        label,
                                        receiverName,
                                        receiverPhone,
                                        addressLine,
                                        ward,
                                        district,
                                        city,
                                        lat,
                                        lng,
                                        isDefault
                                    }) => {
    return prisma.address.create({
        data: {
            userId,
            label,
            receiverName,
            receiverPhone,
            addressLine,
            ward,
            district,
            city,
            lat,
            lng,
            isDefault: Boolean(isDefault)
        }
    });
};

export const findAddressByIdAndUserId = async ({ addressId, userId }) => {
    return prisma.address.findFirst({
        where: {
            id: addressId,
            userId
        }
    });
};

export const updateAddress = async ({ addressId, data }) => {
    return prisma.address.update({
        where: {
            id: addressId
        },
        data: {
            ...data,
            updatedAt: new Date()
        }
    });
};

export const deleteAddress = async (addressId) => {
    return prisma.address.delete({
        where: {
            id: addressId
        }
    });
};