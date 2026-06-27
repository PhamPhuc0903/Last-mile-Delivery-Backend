import prisma from "../config/prisma.js";

export const createSession = async ({ userId, orderId, title }) => {
    return prisma.chatSession.create({
        data: {
            userId,
            orderId: orderId || null,
            title: title || "Chat hỗ trợ đơn hàng"
        }
    });
};

export const findSessionsByUserId = async (userId) => {
    return prisma.chatSession.findMany({
        where: {
            userId
        },
        orderBy: {
            updatedAt: "desc"
        }
    });
};

export const findSessionByIdAndUserId = async ({ sessionId, userId }) => {
    return prisma.chatSession.findFirst({
        where: {
            id: sessionId,
            userId
        }
    });
};

export const findSessionByIdAndUserIdWithMessages = async ({
                                                               sessionId,
                                                               userId
                                                           }) => {
    return prisma.chatSession.findFirst({
        where: {
            id: sessionId,
            userId
        },
        include: {
            messages: {
                orderBy: {
                    createdAt: "asc"
                }
            }
        }
    });
};

export const updateSessionOrderId = async ({ sessionId, orderId }) => {
    return prisma.chatSession.update({
        where: {
            id: sessionId
        },
        data: {
            orderId,
            updatedAt: new Date()
        }
    });
};

export const findRecentMessagesBySessionId = async (sessionId, take = 6) => {
    return prisma.chatMessage.findMany({
        where: {
            sessionId
        },
        orderBy: {
            createdAt: "desc"
        },
        take
    });
};

export const createUserAndBotMessages = async ({
                                                   sessionId,
                                                   userMessageText,
                                                   botMessageText,
                                                   metadata
                                               }) => {
    return prisma.$transaction(async (tx) => {
        const userMessage = await tx.chatMessage.create({
            data: {
                sessionId,
                sender: "USER",
                message: userMessageText
            }
        });

        const botMessage = await tx.chatMessage.create({
            data: {
                sessionId,
                sender: "BOT",
                message: botMessageText,
                metadata
            }
        });

        await tx.chatSession.update({
            where: {
                id: sessionId
            },
            data: {
                updatedAt: new Date()
            }
        });

        return {
            sessionId,
            userMessage,
            botMessage
        };
    });
};

export const closeSession = async (sessionId) => {
    return prisma.chatSession.update({
        where: {
            id: sessionId
        },
        data: {
            status: "CLOSED",
            updatedAt: new Date()
        }
    });
};