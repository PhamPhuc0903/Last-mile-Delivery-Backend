import { z } from "zod";

export const addressIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    })
});

export const updateProfileSchema = z.object({
    body: z.object({
        fullName: z.string().min(1).max(100).optional(),
        email: z.string().email().optional().nullable(),
        avatarUrl: z.string().url().optional().nullable(),
        dateOfBirth: z.string().optional().nullable(),
        gender: z.string().optional().nullable()
    })
});

export const createAddressSchema = z.object({
    body: z.object({
        label: z.string().min(1).max(100).optional().nullable(),
        receiverName: z.string().min(1).max(100),
        receiverPhone: z.string().min(8).max(20),
        addressLine: z.string().min(1),
        ward: z.string().min(1),
        district: z.string().min(1),
        city: z.string().min(1),
        lat: z.number().optional().nullable(),
        lng: z.number().optional().nullable(),
        isDefault: z.boolean().optional()
    })
});

export const updateAddressSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    }),
    body: z.object({
        label: z.string().min(1).max(100).optional().nullable(),
        receiverName: z.string().min(1).max(100).optional(),
        receiverPhone: z.string().min(8).max(20).optional(),
        addressLine: z.string().min(1).optional(),
        ward: z.string().min(1).optional(),
        district: z.string().min(1).optional(),
        city: z.string().min(1).optional(),
        lat: z.number().optional().nullable(),
        lng: z.number().optional().nullable(),
        isDefault: z.boolean().optional()
    })
});