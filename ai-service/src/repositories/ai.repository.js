import prisma from "../config/prisma.js";

export const createDriverRecommendationLog = async ({
                                                        orderId,
                                                        pickupLat,
                                                        pickupLng,
                                                        selectedDriverUserId,
                                                        selectedDriverProfileId,
                                                        score,
                                                        reason,
                                                        input,
                                                        output
                                                    }) => {
    return prisma.aiDriverRecommendationLog.create({
        data: {
            orderId: orderId || null,
            pickupLat,
            pickupLng,
            selectedDriverUserId: selectedDriverUserId || null,
            selectedDriverProfileId: selectedDriverProfileId || null,
            score,
            reason,
            input,
            output
        }
    });
};

export const findActiveEtaModel = async (modelName) => {
    return prisma.aiModel.findFirst({
        where: {
            modelName,
            isActive: true
        },
        orderBy: {
            trainedAt: "desc"
        }
    });
};

export const createEtaLog = async ({
                                       orderId,
                                       distanceKm,
                                       averageSpeedKmh,
                                       trafficLevel,
                                       estimatedMinutes,
                                       input,
                                       output
                                   }) => {
    return prisma.aiEtaLog.create({
        data: {
            orderId: orderId || null,
            distanceKm,
            averageSpeedKmh,
            trafficLevel,
            estimatedMinutes,
            input,
            output
        }
    });
};

export const createAnomalyLog = async ({
                                           orderId,
                                           anomalyScore,
                                           isAnomaly,
                                           reasons,
                                           input,
                                           output
                                       }) => {
    return prisma.aiAnomalyLog.create({
        data: {
            orderId: orderId || null,
            anomalyScore,
            isAnomaly,
            reasons,
            input,
            output
        }
    });
};

export const findRecommendationLogs = async ({ where, skip, limit }) => {
    return prisma.aiDriverRecommendationLog.findMany({
        where,
        orderBy: {
            createdAt: "desc"
        },
        skip,
        take: limit
    });
};

export const countRecommendationLogs = async (where) => {
    return prisma.aiDriverRecommendationLog.count({
        where
    });
};

export const findEtaLogs = async ({ where, skip, limit }) => {
    return prisma.aiEtaLog.findMany({
        where,
        orderBy: {
            createdAt: "desc"
        },
        skip,
        take: limit
    });
};

export const countEtaLogs = async (where) => {
    return prisma.aiEtaLog.count({
        where
    });
};

export const findAnomalyLogs = async ({ where, skip, limit }) => {
    return prisma.aiAnomalyLog.findMany({
        where,
        orderBy: {
            createdAt: "desc"
        },
        skip,
        take: limit
    });
};

export const countAnomalyLogs = async (where) => {
    return prisma.aiAnomalyLog.count({
        where
    });
};

export const createEtaTrainingSample = async (data) => {
    return prisma.aiEtaTrainingSample.create({
        data
    });
};

export const createManyEtaTrainingSamples = async (samples) => {
    return prisma.aiEtaTrainingSample.createMany({
        data: samples
    });
};

export const findEtaTrainingSamples = async () => {
    return prisma.aiEtaTrainingSample.findMany({
        orderBy: {
            createdAt: "asc"
        }
    });
};

export const deactivateActiveEtaModels = async (modelName) => {
    return prisma.aiModel.updateMany({
        where: {
            modelName,
            isActive: true
        },
        data: {
            isActive: false
        }
    });
};

export const createEtaModel = async ({
                                         modelName,
                                         modelVersion,
                                         modelType,
                                         weights,
                                         metrics
                                     }) => {
    return prisma.aiModel.create({
        data: {
            modelName,
            modelVersion,
            modelType,
            weights,
            metrics,
            isActive: true,
            trainedAt: new Date()
        }
    });
};