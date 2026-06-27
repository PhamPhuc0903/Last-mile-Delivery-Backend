import { z } from "zod";

export const uuidParamSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    })
});

export const createOrderSchema = z.object({
    body: z.object({
        pickupAddressLine: z.string().min(1),
        pickupWard: z.string().min(1),
        pickupDistrict: z.string().min(1),
        pickupCity: z.string().min(1),
        pickupLat: z.number(),
        pickupLng: z.number(),

        receiverName: z.string().min(1),
        receiverPhone: z.string().min(8).max(20),

        deliveryAddressLine: z.string().min(1),
        deliveryWard: z.string().min(1),
        deliveryDistrict: z.string().min(1),
        deliveryCity: z.string().min(1),
        deliveryLat: z.number(),
        deliveryLng: z.number(),

        distanceKm: z.number().positive(),
        paymentMethod: z.enum(["COD", "BANK_TRANSFER", "MOMO", "VNPAY"]),

        note: z.string().optional().nullable(),

        items: z
            .array(
                z.object({
                    itemName: z.string().min(1),
                    quantity: z.number().int().positive(),
                    weightKg: z.number().positive(),
                    note: z.string().optional().nullable()
                })
            )
            .min(1)
    })
});

export const updateOrderSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    }),
    body: z.object({
        pickupAddressLine: z.string().min(1).optional(),
        pickupWard: z.string().min(1).optional(),
        pickupDistrict: z.string().min(1).optional(),
        pickupCity: z.string().min(1).optional(),
        pickupLat: z.number().optional(),
        pickupLng: z.number().optional(),

        receiverName: z.string().min(1).optional(),
        receiverPhone: z.string().min(8).max(20).optional(),

        deliveryAddressLine: z.string().min(1).optional(),
        deliveryWard: z.string().min(1).optional(),
        deliveryDistrict: z.string().min(1).optional(),
        deliveryCity: z.string().min(1).optional(),
        deliveryLat: z.number().optional(),
        deliveryLng: z.number().optional(),

        distanceKm: z.number().positive().optional(),
        note: z.string().optional().nullable()
    })
});

export const updateOrderStatusSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    }),
    body: z.object({
        status: z.enum([
            "PENDING",
            "CONFIRMED",
            "ASSIGNED",
            "PICKED_UP",
            "IN_TRANSIT",
            "DELIVERED",
            "CANCELLED",
            "FAILED"
        ]),
        note: z.string().optional().nullable()
    })
});

export const cancelOrderSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    }),
    body: z.object({
        reason: z.string().optional().nullable()
    }).optional()
});