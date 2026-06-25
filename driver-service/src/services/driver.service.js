import prisma from "../config/prisma.js";

const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
    const earthRadiusKm = 6371;

    const toRad = (value) => (value * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
};

export const getMe = async (userId) => {
    let driver = await prisma.driver.findUnique({
        where: {
            userId
        },
        include: {
            locations: {
                orderBy: {
                    recordedAt: "desc"
                },
                take: 10
            }
        }
    });

    if (!driver) {
        driver = await prisma.driver.create({
            data: {
                userId
            },
            include: {
                locations: true
            }
        });
    }

    return driver;
};

export const updateMe = async (userId, data) => {
    const {
        licenseNumber,
        vehicleType,
        vehiclePlate
    } = data;

    const driver = await prisma.driver.upsert({
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

    return driver;
};

export const updateMyStatus = async (userId, { status }) => {
    if (!status) {
        throw new Error("status is required");
    }

    const allowedStatuses = ["OFFLINE", "ONLINE", "BUSY", "SUSPENDED"];

    if (!allowedStatuses.includes(status)) {
        throw new Error("Invalid driver status");
    }

    const driver = await prisma.driver.findUnique({
        where: {
            userId
        }
    });

    if (!driver) {
        throw new Error("Driver profile not found");
    }

    if (driver.verificationStatus !== "APPROVED" && status === "ONLINE") {
        throw new Error("Driver must be approved before going online");
    }

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

export const updateMyLocation = async (userId, data) => {
    const { lat, lng, heading, speed } = data;

    if (lat === undefined || lng === undefined) {
        throw new Error("lat and lng are required");
    }

    const driver = await prisma.driver.findUnique({
        where: {
            userId
        }
    });

    if (!driver) {
        throw new Error("Driver profile not found");
    }

    const result = await prisma.$transaction(async (tx) => {
        const updatedDriver = await tx.driver.update({
            where: {
                id: driver.id
            },
            data: {
                currentLat: lat,
                currentLng: lng,
                updatedAt: new Date()
            }
        });

        const location = await tx.driverLocation.create({
            data: {
                driverId: driver.id,
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

    return result;
};

export const getDrivers = async (query) => {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    const where = {};

    if (query.status) {
        where.status = query.status;
    }

    if (query.verificationStatus) {
        where.verificationStatus = query.verificationStatus;
    }

    if (query.vehicleType) {
        where.vehicleType = query.vehicleType;
    }

    const [drivers, total] = await Promise.all([
        prisma.driver.findMany({
            where,
            orderBy: {
                createdAt: "desc"
            },
            skip,
            take: limit
        }),
        prisma.driver.count({
            where
        })
    ]);

    return {
        items: drivers,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const getNearbyDrivers = async (query) => {
    const lat = Number(query.lat);
    const lng = Number(query.lng);
    const radiusKm = Number(query.radiusKm) > 0 ? Number(query.radiusKm) : 5;

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
        throw new Error("lat and lng are required");
    }

    const drivers = await prisma.driver.findMany({
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

    const nearbyDrivers = drivers
        .map((driver) => {
            const distanceKm = calculateDistanceKm(
                lat,
                lng,
                driver.currentLat,
                driver.currentLng
            );

            return {
                ...driver,
                distanceKm: Number(distanceKm.toFixed(2))
            };
        })
        .filter((driver) => driver.distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm);

    return nearbyDrivers;
};

export const getDriverById = async (driverId) => {
    const driver = await prisma.driver.findUnique({
        where: {
            id: driverId
        },
        include: {
            locations: {
                orderBy: {
                    recordedAt: "desc"
                },
                take: 20
            }
        }
    });

    if (!driver) {
        throw new Error("Driver not found");
    }

    return driver;
};

export const approveDriver = async (driverId) => {
    const driver = await prisma.driver.findUnique({
        where: {
            id: driverId
        }
    });

    if (!driver) {
        throw new Error("Driver not found");
    }

    return prisma.driver.update({
        where: {
            id: driverId
        },
        data: {
            verificationStatus: "APPROVED",
            updatedAt: new Date()
        }
    });
};

export const rejectDriver = async (driverId) => {
    const driver = await prisma.driver.findUnique({
        where: {
            id: driverId
        }
    });

    if (!driver) {
        throw new Error("Driver not found");
    }

    return prisma.driver.update({
        where: {
            id: driverId
        },
        data: {
            verificationStatus: "REJECTED",
            status: "OFFLINE",
            updatedAt: new Date()
        }
    });
};