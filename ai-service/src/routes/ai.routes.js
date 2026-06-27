import express from "express";
import * as aiController from "../controllers/ai.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    etaPredictSchema,
    etaTrainingSampleSchema,
    seedEtaTrainingSamplesSchema,
    recommendDriverSchema,
    anomalyDetectionSchema,
    riskScoreSchema
} from "../validators/ai.validator.js";

const router = express.Router();

router.post(
    "/recommend-driver",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(recommendDriverSchema),
    aiController.recommendDriver
);

router.post(
    "/eta",
    authMiddleware,
    roleMiddleware("ADMIN", "CUSTOMER", "DRIVER"),
    validate(etaPredictSchema),
    aiController.predictEta
);

router.post(
    "/predict-eta",
    authMiddleware,
    roleMiddleware("ADMIN", "CUSTOMER", "DRIVER"),
    validate(etaPredictSchema),
    aiController.predictEta
);

router.post(
    "/anomaly-detection",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(anomalyDetectionSchema),
    aiController.detectAnomaly
);

router.post(
    "/detect-anomaly",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(anomalyDetectionSchema),
    aiController.detectAnomaly
);

router.post(
    "/risk-score",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(riskScoreSchema),
    aiController.calculateRiskScore
);

router.post(
    "/eta/training-samples",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(etaTrainingSampleSchema),
    aiController.createEtaTrainingSample
);

router.post(
    "/eta/training-samples/seed",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(seedEtaTrainingSamplesSchema),
    aiController.seedEtaTrainingSamples
);

router.post(
    "/eta/train",
    authMiddleware,
    roleMiddleware("ADMIN"),
    aiController.trainEtaModel
);

router.get(
    "/eta/model",
    authMiddleware,
    roleMiddleware("ADMIN"),
    aiController.getActiveEtaModel
);

router.post(
    "/eta/predict",
    authMiddleware,
    roleMiddleware("ADMIN", "CUSTOMER", "DRIVER"),
    validate(etaPredictSchema),
    aiController.predictEta
);

router.get(
    "/logs/recommendations",
    authMiddleware,
    roleMiddleware("ADMIN"),
    aiController.getRecommendationLogs
);

router.get(
    "/logs/etas",
    authMiddleware,
    roleMiddleware("ADMIN"),
    aiController.getEtaLogs
);

router.get(
    "/logs/anomalies",
    authMiddleware,
    roleMiddleware("ADMIN"),
    aiController.getAnomalyLogs
);

export default router;