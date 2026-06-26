import { analyzeOrderRiskWithLLM } from "./llm.service.js";
import * as aiRepository from "../repositories/ai.repository.js";

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

const TRAFFIC_LEVELS = ["LOW", "MEDIUM", "HIGH"];
const VEHICLE_TYPES = ["MOTORBIKE", "CAR", "VAN"];

const createHttpError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const assertPositiveNumber = (value, fieldName) => {
    const numberValue = Number(value);

    if (Number.isNaN(numberValue) || numberValue <= 0) {
        throw createHttpError(`${fieldName} must be greater than 0`, 400);
    }

    return numberValue;
};

const assertLatLng = (lat, lng) => {
    if (lat === undefined || lng === undefined) {
        throw createHttpError("pickupLat and pickupLng are required", 400);
    }

    const numberLat = Number(lat);
    const numberLng = Number(lng);

    if (Number.isNaN(numberLat) || Number.isNaN(numberLng)) {
        throw createHttpError("pickupLat and pickupLng must be valid numbers", 400);
    }

    if (numberLat < -90 || numberLat > 90) {
        throw createHttpError("pickupLat must be between -90 and 90", 400);
    }

    if (numberLng < -180 || numberLng > 180) {
        throw createHttpError("pickupLng must be between -180 and 180", 400);
    }

    return {
        pickupLat: numberLat,
        pickupLng: numberLng
    };
};

const normalizeTrafficLevel = (trafficLevel = "MEDIUM") => {
    const normalized = String(trafficLevel).toUpperCase();

    if (!TRAFFIC_LEVELS.includes(normalized)) {
        throw createHttpError("Invalid trafficLevel", 400);
    }

    return normalized;
};

const normalizeVehicleType = (vehicleType = "MOTORBIKE") => {
    const normalized = String(vehicleType).toUpperCase();

    if (!VEHICLE_TYPES.includes(normalized)) {
        throw createHttpError("Invalid vehicleType", 400);
    }

    return normalized;
};

const getTrafficScore = (trafficLevel) => {
    const level = normalizeTrafficLevel(trafficLevel);

    const scores = {
        LOW: 0.2,
        MEDIUM: 0.6,
        HIGH: 1
    };

    return scores[level];
};

const isPeakHour = (hour) => {
    return (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19) ? 1 : 0;
};

const buildEtaFeatures = (data) => {
    const pickupHour =
        data.pickupHour !== undefined
            ? Number(data.pickupHour)
            : new Date().getHours();

    if (Number.isNaN(pickupHour) || pickupHour < 0 || pickupHour > 23) {
        throw createHttpError("pickupHour must be between 0 and 23", 400);
    }

    const vehicleType = normalizeVehicleType(data.vehicleType || "MOTORBIKE");

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
    const distanceKm = assertPositiveNumber(data.distanceKm, "distanceKm");
    const averageSpeedKmh = assertPositiveNumber(
        data.averageSpeedKmh || 25,
        "averageSpeedKmh"
    );
    const trafficLevel = normalizeTrafficLevel(data.trafficLevel || "MEDIUM");

    const trafficMultipliers = {
        LOW: 1,
        MEDIUM: 1.25,
        HIGH: 1.6
    };

    const multiplier = trafficMultipliers[trafficLevel];

    const estimatedMinutes = clamp(
        Math.ceil((distanceKm / averageSpeedKmh) * 60 * multiplier),
        1,
        240
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

    return Number(
        (distanceScore * 0.6 + ratingScore * 0.3 + experienceScore * 0.1).toFixed(2)
    );
};

const parseJsonResponse = async (response) => {
    try {
        return await response.json();
    } catch {
        return null;
    }
};

const getPaginatedResult = async ({
                                      query = {},
                                      findItems,
                                      countItems
                                  }) => {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Math.min(Number(query.limit), 100) : 10;
    const skip = (page - 1) * limit;

    const where = {};

    if (query.orderId) {
        where.orderId = query.orderId;
    }

    const [items, total] = await Promise.all([
        findItems({
            where,
            skip,
            limit
        }),
        countItems(where)
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

export const recommendDriver = async (data, authorizationHeader) => {
    const { orderId, radiusKm, drivers } = data;

    const { pickupLat, pickupLng } = assertLatLng(
        data.pickupLat,
        data.pickupLng
    );

    let candidateDrivers = drivers;

    if (!candidateDrivers || !Array.isArray(candidateDrivers)) {
        const driverServiceUrl =
            process.env.DRIVER_SERVICE_URL || "http://localhost:3003";

        const finalRadiusKm = Number(radiusKm) > 0 ? Number(radiusKm) : 5;

        const url =
            `${driverServiceUrl}/drivers/nearby` +
            `?lat=${pickupLat}&lng=${pickupLng}&radiusKm=${finalRadiusKm}`;

        const response = await fetch(url, {
            headers: {
                Authorization: authorizationHeader || ""
            }
        });

        const json = await parseJsonResponse(response);

        if (!response.ok || !json?.success) {
            throw createHttpError(json?.message || "Cannot get nearby drivers", 400);
        }

        candidateDrivers = json.data || [];
    }

    if (candidateDrivers.length === 0) {
        throw createHttpError("No candidate drivers found", 404);
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

    await aiRepository.createDriverRecommendationLog({
        orderId: orderId || null,
        pickupLat,
        pickupLng,
        selectedDriverUserId: selectedDriver.userId || null,
        selectedDriverProfileId: selectedDriver.id || null,
        score: selectedDriver.aiScore,
        reason: output.reason,
        input: data,
        output
    });

    return output;
};

export const predictEta = async (data) => {
    const { orderId, averageSpeedKmh } = data;

    const distanceKm = assertPositiveNumber(data.distanceKm, "distanceKm");
    const finalAverageSpeedKmh = assertPositiveNumber(
        averageSpeedKmh || 25,
        "averageSpeedKmh"
    );
    const trafficLevel = normalizeTrafficLevel(data.trafficLevel || "MEDIUM");

    const activeModel = await aiRepository.findActiveEtaModel(ETA_MODEL_NAME);

    let output;

    if (!activeModel) {
        output = fallbackEtaPrediction({
            ...data,
            distanceKm,
            averageSpeedKmh: finalAverageSpeedKmh,
            trafficLevel
        });
    } else {
        const features = buildEtaFeatures({
            ...data,
            distanceKm,
            averageSpeedKmh: finalAverageSpeedKmh,
            trafficLevel
        });

        const modelWeights = activeModel.weights;

        if (
            !modelWeights ||
            !Array.isArray(modelWeights.weights) ||
            modelWeights.weights.length !== FEATURE_NAMES.length ||
            typeof modelWeights.bias !== "number"
        ) {
            throw createHttpError("Active ETA model is invalid", 500);
        }

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
                averageSpeedKmh: finalAverageSpeedKmh,
                trafficLevel,
                pickupHour:
                    data.pickupHour !== undefined
                        ? Number(data.pickupHour)
                        : new Date().getHours(),
                vehicleType: normalizeVehicleType(data.vehicleType || "MOTORBIKE"),
                driverRating: data.driverRating || 5,
                driverTotalDeliveries: data.driverTotalDeliveries || 0
            },
            explanation:
                "ETA was predicted using a trained linear regression model from historical delivery samples."
        };
    }

    await aiRepository.createEtaLog({
        orderId: orderId || null,
        distanceKm,
        averageSpeedKmh: finalAverageSpeedKmh,
        trafficLevel,
        estimatedMinutes: output.estimatedMinutes,
        input: data,
        output
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

    if (distanceKm && Number(distanceKm) > 50) {
        anomalyScore += 30;
        reasons.push("Distance is unusually long");
    }

    if (
        shippingFee &&
        distanceKm &&
        Number(distanceKm) > 0 &&
        Number(shippingFee) / Number(distanceKm) > 20000
    ) {
        anomalyScore += 25;
        reasons.push("Shipping fee per km is unusually high");
    }

    if (codAmount && Number(codAmount) > 5000000) {
        anomalyScore += 25;
        reasons.push("COD amount is unusually high");
    }

    if (etaMinutes && Number(etaMinutes) > 180) {
        anomalyScore += 20;
        reasons.push("ETA is unusually long");
    }

    if (driverDistanceKm && Number(driverDistanceKm) > 15) {
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

    await aiRepository.createAnomalyLog({
        orderId: orderId || null,
        anomalyScore,
        isAnomaly,
        reasons,
        input: data,
        output
    });

    return output;
};

export const getRecommendationLogs = async (query) => {
    return getPaginatedResult({
        query,
        findItems: aiRepository.findRecommendationLogs,
        countItems: aiRepository.countRecommendationLogs
    });
};

export const getEtaLogs = async (query) => {
    return getPaginatedResult({
        query,
        findItems: aiRepository.findEtaLogs,
        countItems: aiRepository.countEtaLogs
    });
};

export const getAnomalyLogs = async (query) => {
    return getPaginatedResult({
        query,
        findItems: aiRepository.findAnomalyLogs,
        countItems: aiRepository.countAnomalyLogs
    });
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

    if (distanceKm && Number(distanceKm) > 30) {
        riskScore += 20;
        factors.push("Long delivery distance");
    }

    if (
        shippingFee &&
        distanceKm &&
        Number(distanceKm) > 0 &&
        Number(shippingFee) / Number(distanceKm) > 15000
    ) {
        riskScore += 20;
        factors.push("High shipping fee per kilometer");
    }

    if (codAmount && Number(codAmount) > 3000000) {
        riskScore += 25;
        factors.push("High COD amount");
    }

    if (etaMinutes && Number(etaMinutes) > 120) {
        riskScore += 20;
        factors.push("Long estimated delivery time");
    }

    if (driverDistanceKm && Number(driverDistanceKm) > 10) {
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

    await aiRepository.createAnomalyLog({
        orderId: orderId || null,
        anomalyScore: riskScore,
        isAnomaly: riskScore >= 70,
        reasons: factors,
        input: data,
        output
    });

    return output;
};

export const createEtaTrainingSample = async (data) => {
    const {
        orderId,
        averageSpeedKmh,
        pickupHour,
        driverRating,
        driverTotalDeliveries
    } = data;

    const distanceKm = assertPositiveNumber(data.distanceKm, "distanceKm");
    const actualMinutes = assertPositiveNumber(data.actualMinutes, "actualMinutes");

    const trafficLevel = normalizeTrafficLevel(data.trafficLevel || "MEDIUM");
    const vehicleType = normalizeVehicleType(data.vehicleType || "MOTORBIKE");

    const finalAverageSpeedKmh = assertPositiveNumber(
        averageSpeedKmh || 25,
        "averageSpeedKmh"
    );

    const finalPickupHour =
        pickupHour !== undefined ? Number(pickupHour) : new Date().getHours();

    if (
        Number.isNaN(finalPickupHour) ||
        finalPickupHour < 0 ||
        finalPickupHour > 23
    ) {
        throw createHttpError("pickupHour must be between 0 and 23", 400);
    }

    return aiRepository.createEtaTrainingSample({
        orderId: orderId || null,
        distanceKm,
        averageSpeedKmh: finalAverageSpeedKmh,
        trafficLevel,
        pickupHour: finalPickupHour,
        vehicleType,
        driverRating: driverRating || 5,
        driverTotalDeliveries: driverTotalDeliveries || 0,
        actualMinutes
    });
};

export const seedEtaTrainingSamples = async ({ count = 50 } = {}) => {
    const finalCount = Math.min(Math.max(Number(count) || 50, 1), 1000);

    const trafficLevels = ["LOW", "MEDIUM", "HIGH"];
    const vehicleTypes = ["MOTORBIKE", "CAR", "VAN"];

    const samples = Array.from({ length: finalCount }).map(() => {
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
        const vehiclePenalty =
            vehicleType === "VAN" ? 5 : vehicleType === "CAR" ? 3 : 0;
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

    await aiRepository.createManyEtaTrainingSamples(samples);

    return {
        message: "ETA training samples generated successfully",
        count: samples.length
    };
};

export const trainEtaModel = async () => {
    const samples = await aiRepository.findEtaTrainingSamples();

    if (samples.length < 10) {
        throw createHttpError("At least 10 training samples are required", 400);
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

    await aiRepository.deactivateActiveEtaModels(ETA_MODEL_NAME);

    const modelVersion = `eta-linear-${Date.now()}`;

    const model = await aiRepository.createEtaModel({
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
        }
    });

    return {
        message: "ETA model trained successfully",
        model
    };
};

export const getActiveEtaModel = async () => {
    const model = await aiRepository.findActiveEtaModel(ETA_MODEL_NAME);

    if (!model) {
        throw createHttpError("No active ETA model found", 404);
    }

    return model;
};