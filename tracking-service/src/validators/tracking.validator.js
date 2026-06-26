import { z } from "zod";

export const orderIdParamSchema = z.object({
    params: z.object({
        orderId: z.string().uuid()
    })
});

export const createTrackingLocationSchema = z.object({
    body: z.object({
        orderId: z.string().uuid(),
        driverId: z.string().uuid().optional().nullable(),
        lat: z.number(),
        lng: z.number(),
        eventType: z
            .enum([
                "LOCATION_UPDATE",
                "PICKED_UP",
                "IN_TRANSIT",
                "DELIVERED",
                "FAILED"
            ])
            .optional(),
        note: z.string().optional().nullable()
    })
});

export const createOrderTrackingLocationSchema = z.object({
    params: z.object({
        orderId: z.string().uuid()
    }),
    body: z.object({
        driverId: z.string().uuid().optional().nullable(),
        lat: z.number(),
        lng: z.number(),
        eventType: z
            .enum([
                "LOCATION_UPDATE",
                "PICKED_UP",
                "IN_TRANSIT",
                "DELIVERED",
                "FAILED"
            ])
            .optional(),
        note: z.string().optional().nullable()
    })
});