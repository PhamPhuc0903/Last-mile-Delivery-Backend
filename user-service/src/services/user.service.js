import prisma from "../config/prisma.js";

export const getMe = async (userId) => {
    let profile = await prisma.profile.findUnique({
        where: {
            userId
        }
    });

    if (!profile) {
        profile = await prisma.profile.create({
            data: {
                userId
            }
        });
    }

    return profile;
};

export const updateMe = async (userId, data) => {
    const { fullName, avatarUrl } = data;

    const profile = await prisma.profile.upsert({
        where: {
            userId
        },
        update: {
            fullName,
            avatarUrl
        },
        create: {
            userId,
            fullName,
            avatarUrl
        }
    });

    return profile;
};

export const getAddresses = async (userId) => {
    return prisma.address.findMany({
        where: {
            userId
        },
        orderBy: {
            createdAt: "desc"
        }
    });
};

export const createAddress = async (userId, data) => {
    const {
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
    } = data;

    if (!addressLine) {
        throw new Error("addressLine is required");
    }

    if (isDefault) {
        await prisma.address.updateMany({
            where: {
                userId
            },
            data: {
                isDefault: false
            }
        });
    }

    const address = await prisma.address.create({
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

    return address;
};

export const getAddressById = async (userId, addressId) => {
    const address = await prisma.address.findFirst({
        where: {
            id: addressId,
            userId
        }
    });

    if (!address) {
        throw new Error("Address not found");
    }

    return address;
};

export const updateAddress = async (userId, addressId, data) => {
    const existingAddress = await prisma.address.findFirst({
        where: {
            id: addressId,
            userId
        }
    });

    if (!existingAddress) {
        throw new Error("Address not found");
    }

    if (data.isDefault === true) {
        await prisma.address.updateMany({
            where: {
                userId
            },
            data: {
                isDefault: false
            }
        });
    }

    const address = await prisma.address.update({
        where: {
            id: addressId
        },
        data
    });

    return address;
};

export const deleteAddress = async (userId, addressId) => {
    const existingAddress = await prisma.address.findFirst({
        where: {
            id: addressId,
            userId
        }
    });

    if (!existingAddress) {
        throw new Error("Address not found");
    }

    await prisma.address.delete({
        where: {
            id: addressId
        }
    });

    return {
        message: "Address deleted successfully"
    };
};