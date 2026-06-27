import * as userRepository from "../repositories/user.repository.js";

const createHttpError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

export const getMe = async (userId) => {
    let profile = await userRepository.findProfileByUserId(userId);

    if (!profile) {
        profile = await userRepository.createProfile(userId);
    }

    return profile;
};

export const updateMe = async (userId, data) => {
    const { fullName, avatarUrl } = data;

    return userRepository.upsertProfile({
        userId,
        fullName,
        avatarUrl
    });
};

export const getAddresses = async (userId) => {
    return userRepository.findAddressesByUserId(userId);
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
        throw createHttpError("addressLine is required", 400);
    }

    if (!receiverName) {
        throw createHttpError("receiverName is required", 400);
    }

    if (!receiverPhone) {
        throw createHttpError("receiverPhone is required", 400);
    }

    if (isDefault) {
        await userRepository.clearDefaultAddresses(userId);
    }

    return userRepository.createAddress({
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
    });
};

export const getAddressById = async (userId, addressId) => {
    const address = await userRepository.findAddressByIdAndUserId({
        addressId,
        userId
    });

    if (!address) {
        throw createHttpError("Address not found", 404);
    }

    return address;
};

export const updateAddress = async (userId, addressId, data) => {
    const existingAddress = await userRepository.findAddressByIdAndUserId({
        addressId,
        userId
    });

    if (!existingAddress) {
        throw createHttpError("Address not found", 404);
    }

    if (data.isDefault === true) {
        await userRepository.clearDefaultAddresses(userId);
    }

    return userRepository.updateAddress({
        addressId,
        data
    });
};

export const deleteAddress = async (userId, addressId) => {
    const existingAddress = await userRepository.findAddressByIdAndUserId({
        addressId,
        userId
    });

    if (!existingAddress) {
        throw createHttpError("Address not found", 404);
    }

    await userRepository.deleteAddress(addressId);

    return {
        message: "Address deleted successfully"
    };
};