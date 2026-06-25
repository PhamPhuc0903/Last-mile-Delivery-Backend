import * as aiService from "../services/ai.service.js";

export const recommendDriver = async (req, res) => {
    try {
        const result = await aiService.recommendDriver(
            req.body,
            req.headers.authorization
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Recommend driver error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const predictEta = async (req, res) => {
    try {
        const result = await aiService.predictEta(req.body);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Predict ETA error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const detectAnomaly = async (req, res) => {
    try {
        const result = await aiService.detectAnomaly(req.body);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Detect anomaly error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getRecommendationLogs = async (req, res) => {
    try {
        const result = await aiService.getRecommendationLogs(req.query);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Get recommendation logs error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getEtaLogs = async (req, res) => {
    try {
        const result = await aiService.getEtaLogs(req.query);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Get ETA logs error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getAnomalyLogs = async (req, res) => {
    try {
        const result = await aiService.getAnomalyLogs(req.query);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Get anomaly logs error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const calculateRiskScore = async (req, res) => {
    try {
        const result = await aiService.calculateRiskScore(req.body);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Calculate risk score error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const createEtaTrainingSample = async (req, res) => {
    try {
        const sample = await aiService.createEtaTrainingSample(req.body);

        res.status(201).json({
            success: true,
            data: sample
        });
    } catch (error) {
        console.error("Create ETA training sample error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const seedEtaTrainingSamples = async (req, res) => {
    try {
        const result = await aiService.seedEtaTrainingSamples(req.body);

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Seed ETA training samples error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const trainEtaModel = async (req, res) => {
    try {
        const result = await aiService.trainEtaModel();

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Train ETA model error:", error);

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getActiveEtaModel = async (req, res) => {
    try {
        const model = await aiService.getActiveEtaModel();

        res.status(200).json({
            success: true,
            data: model
        });
    } catch (error) {
        console.error("Get active ETA model error:", error);

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};