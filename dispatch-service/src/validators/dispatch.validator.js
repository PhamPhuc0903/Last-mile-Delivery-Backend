import { z } from "zod";

export const assignmentIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    })
});

export const createAssignmentSchema = z.object({
    body: z.object({
        orderId: z.string().uuid(),
        driverId: z.string().uuid(),
        note: z.string().optional().nullable()
    })
});

export const autoAssignSchema = z.object({
    body: z.object({
        orderId: z.string().uuid(),
        pickupLat: z.number().optional(),
        pickupLng: z.number().optional(),
        maxDistanceKm: z.number().positive().optional()
    })
});

export const rejectAssignmentSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    }),
    body: z.object({
        reason: z.string().optional().nullable()
    }).optional()
});

export const cancelAssignmentSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    }),
    body: z.object({
        reason: z.string().optional().nullable()
    }).optional()
});