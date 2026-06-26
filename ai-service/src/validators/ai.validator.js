import { z } from "zod";

export const etaPredictSchema = z.object({
    body: z.object({
        orderId: z.string().uuid().optional().nullable(),
        distanceKm: z.number().positive(),
        averageSpeedKmh: z.number().positive().optional(),
        trafficLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
        pickupHour: z.number().int().min(0).max(23).optional(),
        vehicleType: z.enum(["MOTORBIKE", "CAR", "VAN"]).optional(),
        driverRating: z.number().min(0).max(5).optional(),
        driverTotalDeliveries: z.number().int().min(0).optional()
    })
});

export const etaTrainingSampleSchema = z.object({
    body: z.object({
        orderId: z.string().uuid().optional().nullable(),
        distanceKm: z.number().positive(),
        averageSpeedKmh: z.number().positive().optional(),
        trafficLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
        pickupHour: z.number().int().min(0).max(23).optional(),
        vehicleType: z.enum(["MOTORBIKE", "CAR", "VAN"]).optional(),
        driverRating: z.number().min(0).max(5).optional(),
        driverTotalDeliveries: z.number().int().min(0).optional(),
        actualMinutes: z.number().int().positive()
    })
});

export const seedEtaTrainingSamplesSchema = z.object({
    body: z.object({
        count: z.number().int().min(1).max(1000).optional()
    }).optional()
});

export const recommendDriverSchema = z.object({
    body: z.object({
        orderId: z.string().uuid().optional().nullable(),
        pickupLat: z.number(),
        pickupLng: z.number(),
        drivers: z.array(z.any()).min(1)
    })
});

export const anomalyDetectionSchema = z.object({
    body: z.object({
        orderId: z.string().uuid().optional().nullable(),
        distanceKm: z.number().optional(),
        estimatedMinutes: z.number().optional(),
        actualMinutes: z.number().optional(),
        status: z.string().optional(),
        events: z.array(z.any()).optional()
    })
});

export const riskScoreSchema = z.object({
    body: z.object({
        orderId: z.string().uuid().optional().nullable(),
        distanceKm: z.number().optional(),
        codAmount: z.number().optional(),
        estimatedMinutes: z.number().optional(),
        trafficLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
        driverDistanceKm: z.number().optional()
    })
});