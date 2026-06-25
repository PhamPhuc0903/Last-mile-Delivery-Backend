import prisma from "../config/prisma.js";
import { analyzeOrderRiskWithLLM } from "./llm.service.js";

const ETA_MODEL_NAME = "ETA_PREDICTION";
const ETA_MODEL_TYPE = "LINEAR_REGRESSION_NODE_JS";

const FEATURE_NAMES = [
    "distanceKm",
    "averageSpeedKmh",
    "trafficScore",
    "pickupHour",
    "isPeakHour",
    "isMotorbike",
    "isCar",
    "driverRating",
    "driverExperience"
];

const getTrafficScore = (trafficLevel) => {
    const scores = {
        LOW: 0.2,
        MEDIUM: 0.6,
        HIGH: 1
    };

    return scores[trafficLevel] ?? 0.6;
};

const isPeakHour = (hour) => {
    return (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19) ? 1 : 0;
};

const buildEtaFeatures = (data) => {
    const pickupHour =
        data.pickupHour !== undefined
            ? Number(data.pickupHour)
            : new Date().getHours();

    const vehicleType = data.vehicleType || "MOTORBIKE";

    return [
        Number(data.distanceKm || 0) / 50,
        Number(data.averageSpeedKmh || 25) / 60,
        getTrafficScore(data.trafficLevel || "MEDIUM"),
        pickupHour / 23,
        isPeakHour(pickupHour),
        vehicleType === "MOTORBIKE" ? 1 : 0,
        vehicleType === "CAR" ? 1 : 0,
        Number(data.driverRating || 5) / 5,
        Math.min(Number(data.driverTotalDeliveries || 0), 500) / 500
    ];
};

const normalizeMinutes = (minutes) => {
    return Number(minutes) / 180;
};

const denormalizeMinutes = (value) => {
    return Number(value) * 180;
};

const clamp = (value, min, max) => {
    return Math.max(min, Math.min(max, value));
};

const predictNormalized = (features, weights, bias) => {
    return features.reduce((sum, value, index) => {
        return sum + value * weights[index];
    }, bias);
};

const fallbackEtaPrediction = (data) => {
    const distanceKm = Number(data.distanceKm);
    const averageSpeedKmh = Number(data.averageSpeedKmh || 25);
    const trafficLevel = data.trafficLevel || "MEDIUM";

    const trafficMultipliers = {
        LOW: 1,
        MEDIUM: 1.25,
        HIGH: 1.6
    };

    const multiplier = trafficMultipliers[trafficLevel] || 1.25;

    const estimatedMinutes = Math.ceil(
        (distanceKm / averageSpeedKmh) * 60 * multiplier
    );

    return {
        estimatedMinutes,
        modelSource: "fallback_formula",
        modelVersion: "fallback-v1",
        confidence: 0.55,
        explanation:
            "ETA was estimated using fallback formula because no trained model is active."
    };
};

const calculateDriverScore = (driver) => {
    const distanceScore = Math.max(0, 100 - (driver.distanceKm || 0) * 10);
    const ratingScore = (driver.rating || 5) * 10;
    const experienceScore = Math.min(driver.totalDeliveries || 0, 100) * 0.2;

    return Number((distanceScore * 0.6 + ratingScore * 0.3 + experienceScore * 0.1).toFixed(2));
};

export const recommendDriver = async (data, authorizationHeader) => {
    const {
        orderId,
        pickupLat,
        pickupLng,
        radiusKm,
        drivers
    } = data;

    if (!pickupLat || !pickupLng) {
        throw new Error("pickupLat and pickupLng are required");
    }

    let candidateDrivers = drivers;

    if (!candidateDrivers || !Array.isArray(candidateDrivers)) {
        const driverServiceUrl =
            process.env.DRIVER_SERVICE_URL || "http://localhost:3003";

        const url =
            `${driverServiceUrl}/drivers/nearby` +
            `?lat=${pickupLat}&lng=${pickupLng}&radiusKm=${radiusKm || 5}`;

        const response = await fetch(url, {
            headers: {
                Authorization: authorizationHeader
            }
        });

        const json = await response.json();

        if (!response.ok || !json.success) {
            throw new Error(json.message || "Cannot get nearby drivers");
        }

        candidateDrivers = json.data || [];
    }

    if (candidateDrivers.length === 0) {
        throw new Error("No candidate drivers found");
    }

    const rankedDrivers = candidateDrivers
        .map((driver) => ({
            ...driver,
            aiScore: calculateDriverScore(driver)
        }))
        .sort((a, b) => b.aiScore - a.aiScore);

    const selectedDriver = rankedDrivers[0];

    const output = {
        selectedDriver,
        rankedDrivers,
        reason: "Selected by distance, rating and delivery experience"
    };

    await prisma.aiDriverRecommendationLog.create({
        data: {
            orderId: orderId || null,
            pickupLat,
            pickupLng,
            selectedDriverUserId: selectedDriver.userId || null,
            selectedDriverProfileId: selectedDriver.id || null,
            score: selectedDriver.aiScore,
            reason: output.reason,
            input: data,
            output
        }
    });

    return output;
};

export const predictEta = async (data) => {
    const {
        orderId,
        distanceKm,
        averageSpeedKmh,
        trafficLevel
    } = data;

    if (distanceKm === undefined) {
        throw new Error("distanceKm is required");
    }

    const activeModel = await prisma.aiModel.findFirst({
        where: {
            modelName: ETA_MODEL_NAME,
            isActive: true
        },
        orderBy: {
            trainedAt: "desc"
        }
    });

    let output;

    if (!activeModel) {
        output = fallbackEtaPrediction(data);
    } else {
        const features = buildEtaFeatures(data);
        const modelWeights = activeModel.weights;

        const normalizedPrediction = predictNormalized(
            features,
            modelWeights.weights,
            modelWeights.bias
        );

        const estimatedMinutes = clamp(
            Math.round(denormalizeMinutes(normalizedPrediction)),
            1,
            240
        );

        output = {
            estimatedMinutes,
            modelSource: "trained_model",
            modelName: activeModel.modelName,
            modelVersion: activeModel.modelVersion,
            modelType: activeModel.modelType,
            confidence: activeModel.metrics?.confidence || 0.75,
            features: {
                distanceKm,
                averageSpeedKmh: averageSpeedKmh || 25,
                trafficLevel: trafficLevel || "MEDIUM",
                pickupHour:
                    data.pickupHour !== undefined
                        ? Number(data.pickupHour)
                        : new Date().getHours(),
                vehicleType: data.vehicleType || "MOTORBIKE",
                driverRating: data.driverRating || 5,
                driverTotalDeliveries: data.driverTotalDeliveries || 0
            },
            explanation:
                "ETA was predicted using a trained linear regression model from historical delivery samples."
        };
    }

    await prisma.aiEtaLog.create({
        data: {
            orderId: orderId || null,
            distanceKm,
            averageSpeedKmh: averageSpeedKmh || 25,
            trafficLevel: trafficLevel || "MEDIUM",
            estimatedMinutes: output.estimatedMinutes,
            input: data,
            output
        }
    });

    return output;
};

export const detectAnomaly = async (data) => {
    const {
        orderId,
        distanceKm,
        shippingFee,
        codAmount,
        etaMinutes,
        driverDistanceKm
    } = data;

    let anomalyScore = 0;
    const reasons = [];

    if (distanceKm && distanceKm > 50) {
        anomalyScore += 30;
        reasons.push("Distance is unusually long");
    }

    if (shippingFee && distanceKm && shippingFee / distanceKm > 20000) {
        anomalyScore += 25;
        reasons.push("Shipping fee per km is unusually high");
    }

    if (codAmount && codAmount > 5000000) {
        anomalyScore += 25;
        reasons.push("COD amount is unusually high");
    }

    if (etaMinutes && etaMinutes > 180) {
        anomalyScore += 20;
        reasons.push("ETA is unusually long");
    }

    if (driverDistanceKm && driverDistanceKm > 15) {
        anomalyScore += 20;
        reasons.push("Assigned driver is too far from pickup location");
    }

    anomalyScore = Math.min(anomalyScore, 100);
    const isAnomaly = anomalyScore >= 50;

    const output = {
        anomalyScore,
        isAnomaly,
        reasons
    };

    await prisma.aiAnomalyLog.create({
        data: {
            orderId: orderId || null,
            anomalyScore,
            isAnomaly,
            reasons,
            input: data,
            output
        }
    });

    return output;
};

const getPaginatedLogs = async (model, query) => {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    const where = {};

    if (query.orderId) {
        where.orderId = query.orderId;
    }

    const [items, total] = await Promise.all([
        model.findMany({
            where,
            orderBy: {
                createdAt: "desc"
            },
            skip,
            take: limit
        }),
        model.count({
            where
        })
    ]);

    return {
        items,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const getRecommendationLogs = async (query) => {
    return getPaginatedLogs(prisma.aiDriverRecommendationLog, query);
};

export const getEtaLogs = async (query) => {
    return getPaginatedLogs(prisma.aiEtaLog, query);
};

export const getAnomalyLogs = async (query) => {
    return getPaginatedLogs(prisma.aiAnomalyLog, query);
};

export const calculateRiskScore = async (data) => {
    const {
        orderId,
        distanceKm,
        shippingFee,
        codAmount,
        etaMinutes,
        driverDistanceKm
    } = data;

    let riskScore = 0;
    const factors = [];

    if (distanceKm && distanceKm > 30) {
        riskScore += 20;
        factors.push("Long delivery distance");
    }

    if (shippingFee && distanceKm && shippingFee / distanceKm > 15000) {
        riskScore += 20;
        factors.push("High shipping fee per kilometer");
    }

    if (codAmount && codAmount > 3000000) {
        riskScore += 25;
        factors.push("High COD amount");
    }

    if (etaMinutes && etaMinutes > 120) {
        riskScore += 20;
        factors.push("Long estimated delivery time");
    }

    if (driverDistanceKm && driverDistanceKm > 10) {
        riskScore += 15;
        factors.push("Driver is far from pickup location");
    }

    riskScore = Math.min(riskScore, 100);

    let riskLevel = "LOW";

    if (riskScore >= 70) {
        riskLevel = "HIGH";
    } else if (riskScore >= 40) {
        riskLevel = "MEDIUM";
    }

    const ruleBasedOutput = {
        orderId: orderId || null,
        riskScore,
        riskLevel,
        factors
    };

    const aiAnalysis = await analyzeOrderRiskWithLLM(data, ruleBasedOutput);

    const output = {
        ...ruleBasedOutput,
        aiAnalysis
    };

    await prisma.aiAnomalyLog.create({
        data: {
            orderId: orderId || null,
            anomalyScore: riskScore,
            isAnomaly: riskScore >= 70,
            reasons: factors,
            input: data,
            output
        }
    });

    return output;
};

export const createEtaTrainingSample = async (data) => {
    const {
        orderId,
        distanceKm,
        averageSpeedKmh,
        trafficLevel,
        pickupHour,
        vehicleType,
        driverRating,
        driverTotalDeliveries,
        actualMinutes
    } = data;

    if (distanceKm === undefined || actualMinutes === undefined) {
        throw new Error("distanceKm and actualMinutes are required");
    }

    return prisma.aiEtaTrainingSample.create({
        data: {
            orderId: orderId || null,
            distanceKm,
            averageSpeedKmh: averageSpeedKmh || 25,
            trafficLevel: trafficLevel || "MEDIUM",
            pickupHour:
                pickupHour !== undefined ? Number(pickupHour) : new Date().getHours(),
            vehicleType: vehicleType || "MOTORBIKE",
            driverRating: driverRating || 5,
            driverTotalDeliveries: driverTotalDeliveries || 0,
            actualMinutes
        }
    });
};

export const seedEtaTrainingSamples = async ({ count = 50 } = {}) => {
    const trafficLevels = ["LOW", "MEDIUM", "HIGH"];
    const vehicleTypes = ["MOTORBIKE", "CAR", "VAN"];

    const samples = Array.from({ length: Number(count) || 50 }).map(() => {
        const distanceKm = Number((Math.random() * 25 + 1).toFixed(2));
        const averageSpeedKmh = Number((Math.random() * 25 + 15).toFixed(2));
        const trafficLevel =
            trafficLevels[Math.floor(Math.random() * trafficLevels.length)];
        const pickupHour = Math.floor(Math.random() * 24);
        const vehicleType =
            vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
        const driverRating = Number((Math.random() * 1.2 + 3.8).toFixed(1));
        const driverTotalDeliveries = Math.floor(Math.random() * 400);

        const trafficMultiplier = {
            LOW: 1,
            MEDIUM: 1.25,
            HIGH: 1.6
        }[trafficLevel];

        const peakPenalty = isPeakHour(pickupHour) ? 6 : 0;
        const vehiclePenalty = vehicleType === "VAN" ? 5 : vehicleType === "CAR" ? 3 : 0;
        const randomNoise = Math.floor(Math.random() * 8);

        const actualMinutes = Math.max(
            5,
            Math.ceil(
                (distanceKm / averageSpeedKmh) * 60 * trafficMultiplier +
                peakPenalty +
                vehiclePenalty +
                randomNoise
            )
        );

        return {
            distanceKm,
            averageSpeedKmh,
            trafficLevel,
            pickupHour,
            vehicleType,
            driverRating,
            driverTotalDeliveries,
            actualMinutes
        };
    });

    await prisma.aiEtaTrainingSample.createMany({
        data: samples
    });

    return {
        message: "ETA training samples generated successfully",
        count: samples.length
    };
};

export const trainEtaModel = async () => {
    const samples = await prisma.aiEtaTrainingSample.findMany({
        orderBy: {
            createdAt: "asc"
        }
    });

    if (samples.length < 10) {
        throw new Error("At least 10 training samples are required");
    }

    let weights = Array(FEATURE_NAMES.length).fill(0);
    let bias = 0;

    const learningRate = 0.05;
    const epochs = 1500;

    for (let epoch = 0; epoch < epochs; epoch++) {
        let weightGradients = Array(FEATURE_NAMES.length).fill(0);
        let biasGradient = 0;

        for (const sample of samples) {
            const features = buildEtaFeatures(sample);
            const target = normalizeMinutes(sample.actualMinutes);

            const prediction = predictNormalized(features, weights, bias);
            const error = prediction - target;

            for (let i = 0; i < weights.length; i++) {
                weightGradients[i] += error * features[i];
            }

            biasGradient += error;
        }

        for (let i = 0; i < weights.length; i++) {
            weights[i] -= learningRate * (weightGradients[i] / samples.length);
        }

        bias -= learningRate * (biasGradient / samples.length);
    }

    const errors = samples.map((sample) => {
        const features = buildEtaFeatures(sample);
        const prediction = predictNormalized(features, weights, bias);
        const predictedMinutes = clamp(
            Math.round(denormalizeMinutes(prediction)),
            1,
            240
        );

        return Math.abs(predictedMinutes - sample.actualMinutes);
    });

    const mae =
        errors.reduce((sum, value) => sum + value, 0) / Math.max(errors.length, 1);

    const confidence = Number(clamp(1 - mae / 60, 0.3, 0.95).toFixed(2));

    await prisma.aiModel.updateMany({
        where: {
            modelName: ETA_MODEL_NAME,
            isActive: true
        },
        data: {
            isActive: false
        }
    });

    const modelVersion = `eta-linear-${Date.now()}`;

    const model = await prisma.aiModel.create({
        data: {
            modelName: ETA_MODEL_NAME,
            modelVersion,
            modelType: ETA_MODEL_TYPE,
            weights: {
                bias,
                weights,
                featureNames: FEATURE_NAMES,
                targetNormalization: {
                    maxMinutes: 180
                }
            },
            metrics: {
                trainingSamples: samples.length,
                maeMinutes: Number(mae.toFixed(2)),
                confidence,
                epochs,
                learningRate
            },
            isActive: true,
            trainedAt: new Date()
        }
    });

    return {
        message: "ETA model trained successfully",
        model
    };
};

export const getActiveEtaModel = async () => {
    const model = await prisma.aiModel.findFirst({
        where: {
            modelName: ETA_MODEL_NAME,
            isActive: true
        },
        orderBy: {
            trainedAt: "desc"
        }
    });

    if (!model) {
        throw new Error("No active ETA model found");
    }

    return model;
};