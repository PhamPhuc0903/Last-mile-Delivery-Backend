import { z } from "zod";

const phoneSchema = z
    .string()
    .min(8, "phone must have at least 8 characters")
    .max(20, "phone must have at most 20 characters");

const passwordSchema = z
    .string()
    .min(6, "password must have at least 6 characters");

export const registerSchema = z.object({
    body: z.object({
        fullName: z.string().min(1).max(100),
        phone: phoneSchema,
        email: z.string().email().optional().nullable(),
        password: passwordSchema,
        role: z.enum(["ADMIN", "CUSTOMER", "DRIVER"]).optional()
    })
});

export const loginSchema = z.object({
    body: z.object({
        phone: phoneSchema,
        password: z.string().min(1)
    })
});

export const refreshTokenSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1)
    })
});

export const changePasswordSchema = z.object({
    body: z.object({
        oldPassword: z.string().min(1),
        newPassword: passwordSchema
    })
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        phone: phoneSchema
    })
});

export const resetPasswordSchema = z.object({
    body: z.object({
        resetToken: z.string().min(1),
        newPassword: passwordSchema
    })
});