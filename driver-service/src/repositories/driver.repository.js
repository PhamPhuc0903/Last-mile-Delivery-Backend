import prisma from "../config/prisma.js";

export const findDriverByUserIdWithLocations = async (userId, take = 10) => {
    return prisma.driver.findUnique({
        where: {
            userId
        },
        include: {
            locations: {
                orderBy: {
                    recordedAt: "desc"
                },
                take
            }
        }
    });
};

export const createDriverByUserId = async (userId) => {
    return prisma.driver.create({
        data: {
            userId
        },
        include: {
            locations: true
        }
    });
};

export const upsertDriverProfile = async ({
                                              userId,
                                              licenseNumber,
                                              vehicleType,
                                              vehiclePlate
                                          }) => {
    return prisma.driver.upsert({
        where: {
            userId
        },
        update: {
            licenseNumber,
            vehicleType,
            vehiclePlate,
            updatedAt: new Date()
        },
        create: {
            userId,
            licenseNumber,
            vehicleType: vehicleType || "MOTORBIKE",
            vehiclePlate
        }
    });
};

export const findDriverByUserId = async (userId) => {
    return prisma.driver.findUnique({
        where: {
            userId
        }
    });
};

export const updateDriverStatusByUserId = async ({ userId, status }) => {
    return prisma.driver.update({
        where: {
            userId
        },
        data: {
            status,
            updatedAt: new Date()
        }
    });
};

export const updateDriverLocation = async ({
                                               driverId,
                                               lat,
                                               lng,
                                               heading,
                                               speed
                                           }) => {
    return prisma.$transaction(async (tx) => {
        const updatedDriver = await tx.driver.update({
            where: {
                id: driverId
            },
            data: {
                currentLat: lat,
                currentLng: lng,
                updatedAt: new Date()
            }
        });

        const location = await tx.driverLocation.create({
            data: {
                driverId,
                lat,
                lng,
                heading,
                speed
            }
        });

        return {
            driver: updatedDriver,
            location
        };
    });
};

export const findDrivers = async ({ where, skip, limit }) => {
    return prisma.driver.findMany({
        where,
        orderBy: {
            createdAt: "desc"
        },
        skip,
        take: limit
    });
};

export const countDrivers = async (where) => {
    return prisma.driver.count({
        where
    });
};

export const findOnlineApprovedDriversWithLocation = async () => {
    return prisma.driver.findMany({
        where: {
            status: "ONLINE",
            verificationStatus: "APPROVED",
            currentLat: {
                not: null
            },
            currentLng: {
                not: null
            }
        }
    });
};

export const findDriverByIdWithLocations = async (driverId, take = 20) => {
    return prisma.driver.findUnique({
        where: {
            id: driverId
        },
        include: {
            locations: {
                orderBy: {
                    recordedAt: "desc"
                },
                take
            }
        }
    });
};

export const findDriverById = async (driverId) => {
    return prisma.driver.findUnique({
        where: {
            id: driverId
        }
    });
};

export const updateDriverVerificationStatus = async ({
                                                         driverId,
                                                         verificationStatus,
                                                         status
                                                     }) => {
    return prisma.driver.update({
        where: {
            id: driverId
        },
        data: {
            verificationStatus,
            status,
            updatedAt: new Date()
        }
    });
};