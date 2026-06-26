import { z } from "zod";

export const driverIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    })
});

export const updateDriverProfileSchema = z.object({
    body: z.object({
        vehicleType: z.enum(["MOTORBIKE", "CAR", "VAN"]).optional(),
        vehiclePlate: z.string().min(1).max(30).optional(),
        licenseNumber: z.string().min(1).max(50).optional(),
        identityNumber: z.string().min(1).max(50).optional(),
        note: z.string().optional().nullable()
    })
});

export const updateDriverStatusSchema = z.object({
    body: z.object({
        status: z.enum(["OFFLINE", "ONLINE", "BUSY", "SUSPENDED"])
    })
});

export const updateDriverLocationSchema = z.object({
    body: z.object({
        lat: z.number(),
        lng: z.number()
    })
});

export const nearbyDriversQuerySchema = z.object({
    query: z.object({
        lat: z.string().optional(),
        lng: z.string().optional(),
        radiusKm: z.string().optional()
    }).optional()
});

export const rejectDriverSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    }),
    body: z.object({
        reason: z.string().optional().nullable()
    }).optional()
});