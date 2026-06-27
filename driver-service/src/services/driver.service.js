import * as driverRepository from "../repositories/driver.repository.js";

const DRIVER_STATUSES = ["OFFLINE", "ONLINE", "BUSY", "SUSPENDED"];
const DRIVER_VERIFICATION_STATUSES = ["PENDING", "APPROVED", "REJECTED"];
const VEHICLE_TYPES = ["MOTORBIKE", "CAR", "VAN"];

const createHttpError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

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

const assertValidLatLng = (lat, lng) => {
    if (lat === undefined || lng === undefined) {
        throw createHttpError("lat and lng are required", 400);
    }

    const numberLat = Number(lat);
    const numberLng = Number(lng);

    if (Number.isNaN(numberLat) || Number.isNaN(numberLng)) {
        throw createHttpError("lat and lng must be valid numbers", 400);
    }

    if (numberLat < -90 || numberLat > 90) {
        throw createHttpError("lat must be between -90 and 90", 400);
    }

    if (numberLng < -180 || numberLng > 180) {
        throw createHttpError("lng must be between -180 and 180", 400);
    }

    return {
        lat: numberLat,
        lng: numberLng
    };
};

export const getMe = async (userId) => {
    let driver = await driverRepository.findDriverByUserIdWithLocations(userId, 10);

    if (!driver) {
        driver = await driverRepository.createDriverByUserId(userId);
    }

    return driver;
};

export const updateMe = async (userId, data) => {
    const { licenseNumber, vehicleType, vehiclePlate } = data;

    if (vehicleType && !VEHICLE_TYPES.includes(vehicleType)) {
        throw createHttpError("Invalid vehicle type", 400);
    }

    return driverRepository.upsertDriverProfile({
        userId,
        licenseNumber,
        vehicleType,
        vehiclePlate
    });
};

export const updateMyStatus = async (userId, { status }) => {
    if (!status) {
        throw createHttpError("status is required", 400);
    }

    if (!DRIVER_STATUSES.includes(status)) {
        throw createHttpError("Invalid driver status", 400);
    }

    const driver = await driverRepository.findDriverByUserId(userId);

    if (!driver) {
        throw createHttpError("Driver profile not found", 404);
    }

    if (driver.verificationStatus !== "APPROVED" && status === "ONLINE") {
        throw createHttpError("Driver must be approved before going online", 400);
    }

    if (driver.verificationStatus === "REJECTED" && status !== "OFFLINE") {
        throw createHttpError("Rejected driver cannot change status", 400);
    }

    if (driver.status === "SUSPENDED" && status !== "OFFLINE") {
        throw createHttpError("Suspended driver cannot go online or busy", 400);
    }

    return driverRepository.updateDriverStatusByUserId({
        userId,
        status
    });
};

export const updateMyLocation = async (userId, data) => {
    const { lat, lng } = assertValidLatLng(data.lat, data.lng);
    const { heading, speed } = data;

    const driver = await driverRepository.findDriverByUserId(userId);

    if (!driver) {
        throw createHttpError("Driver profile not found", 404);
    }

    if (driver.verificationStatus !== "APPROVED") {
        throw createHttpError("Driver must be approved before updating location", 400);
    }

    if (driver.status === "SUSPENDED") {
        throw createHttpError("Suspended driver cannot update location", 400);
    }

    return driverRepository.updateDriverLocation({
        driverId: driver.id,
        lat,
        lng,
        heading,
        speed
    });
};

export const getDrivers = async (query = {}) => {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Math.min(Number(query.limit), 100) : 10;
    const skip = (page - 1) * limit;

    const where = {};

    if (query.status) {
        if (!DRIVER_STATUSES.includes(query.status)) {
            throw createHttpError("Invalid driver status", 400);
        }

        where.status = query.status;
    }

    if (query.verificationStatus) {
        if (!DRIVER_VERIFICATION_STATUSES.includes(query.verificationStatus)) {
            throw createHttpError("Invalid driver verification status", 400);
        }

        where.verificationStatus = query.verificationStatus;
    }

    if (query.vehicleType) {
        if (!VEHICLE_TYPES.includes(query.vehicleType)) {
            throw createHttpError("Invalid vehicle type", 400);
        }

        where.vehicleType = query.vehicleType;
    }

    const [drivers, total] = await Promise.all([
        driverRepository.findDrivers({
            where,
            skip,
            limit
        }),
        driverRepository.countDrivers(where)
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

export const getNearbyDrivers = async (query = {}) => {
    const { lat, lng } = assertValidLatLng(query.lat, query.lng);
    const radiusKm = Number(query.radiusKm) > 0 ? Number(query.radiusKm) : 5;

    const drivers = await driverRepository.findOnlineApprovedDriversWithLocation();

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
    const driver = await driverRepository.findDriverByIdWithLocations(driverId, 20);

    if (!driver) {
        throw createHttpError("Driver not found", 404);
    }

    return driver;
};

export const approveDriver = async (driverId) => {
    const driver = await driverRepository.findDriverById(driverId);

    if (!driver) {
        throw createHttpError("Driver not found", 404);
    }

    return driverRepository.updateDriverVerificationStatus({
        driverId,
        verificationStatus: "APPROVED",
        status: driver.status === "SUSPENDED" ? "OFFLINE" : driver.status
    });
};

export const rejectDriver = async (driverId, data = {}) => {
    const driver = await driverRepository.findDriverById(driverId);

    if (!driver) {
        throw createHttpError("Driver not found", 404);
    }

    return driverRepository.updateDriverVerificationStatus({
        driverId,
        verificationStatus: "REJECTED",
        status: "OFFLINE"
    });
};