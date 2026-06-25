import prisma from "../config/prisma.js";
import { generateChatbotAnswer } from "./llm.service.js";

const getOrderContext = async (orderId, authorizationHeader) => {
    if (!orderId) {
        return null;
    }

    const orderServiceUrl = process.env.ORDER_SERVICE_URL || "http://localhost:3002";

    try {
        const response = await fetch(`${orderServiceUrl}/orders/${orderId}`, {
            headers: {
                Authorization: authorizationHeader
            }
        });

        const json = await response.json();

        if (!response.ok || !json.success) {
            return null;
        }

        return json.data;
    } catch {
        return null;
    }
};

export const createSession = async (userId, data) => {
    const { orderId, title } = data;

    return prisma.chatSession.create({
        data: {
            userId,
            orderId: orderId || null,
            title: title || "Chat hỗ trợ đơn hàng"
        }
    });
};

export const getMySessions = async (userId) => {
    return prisma.chatSession.findMany({
        where: {
            userId
        },
        orderBy: {
            updatedAt: "desc"
        }
    });
};

export const getSessionById = async (userId, sessionId) => {
    const session = await prisma.chatSession.findFirst({
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

    if (!session) {
        throw new Error("Chat session not found");
    }

    return session;
};

export const sendMessage = async (
    userId,
    sessionId,
    { message, orderId },
    authorizationHeader
) => {
    if (!message) {
        throw new Error("message is required");
    }

    let session;

    if (sessionId) {
        session = await prisma.chatSession.findFirst({
            where: {
                id: sessionId,
                userId
            }
        });

        if (!session) {
            throw new Error("Chat session not found");
        }
    } else {
        session = await prisma.chatSession.create({
            data: {
                userId,
                orderId: orderId || null,
                title: "Chat hỗ trợ đơn hàng"
            }
        });
    }

    const orderContext = await getOrderContext(
        orderId || session.orderId,
        authorizationHeader
    );

    const recentMessages = await prisma.chatMessage.findMany({
        where: {
            sessionId: session.id
        },
        orderBy: {
            createdAt: "desc"
        },
        take: 6
    });

    const result = await prisma.$transaction(async (tx) => {
        const userMessage = await tx.chatMessage.create({
            data: {
                sessionId: session.id,
                sender: "USER",
                message
            }
        });

        const aiResult = await generateChatbotAnswer({
            question: message,
            orderContext,
            history: recentMessages.reverse()
        });

        const botMessage = await tx.chatMessage.create({
            data: {
                sessionId: session.id,
                sender: "BOT",
                message: aiResult.answer,
                metadata: {
                    provider: aiResult.provider,
                    orderId: orderId || session.orderId || null
                }
            }
        });

        await tx.chatSession.update({
            where: {
                id: session.id
            },
            data: {
                updatedAt: new Date()
            }
        });

        return {
            sessionId: session.id,
            userMessage,
            botMessage
        };
    });

    return result;
};

export const closeSession = async (userId, sessionId) => {
    const session = await prisma.chatSession.findFirst({
        where: {
            id: sessionId,
            userId
        }
    });

    if (!session) {
        throw new Error("Chat session not found");
    }

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

export const getSuggestedQuestions = async () => {
    return [
        {
            intent: "ORDER_STATUS",
            question: "Đơn hàng của tôi đang ở trạng thái nào?"
        },
        {
            intent: "ORDER_LOCATION",
            question: "Đơn hàng của tôi hiện đang ở đâu?"
        },
        {
            intent: "ORDER_ETA",
            question: "Khi nào tôi nhận được hàng?"
        },
        {
            intent: "DRIVER_INFO",
            question: "Ai là tài xế đang giao đơn của tôi?"
        },
        {
            intent: "DELIVERY_FEE",
            question: "Phí giao hàng của đơn này là bao nhiêu?"
        },
        {
            intent: "FAILED_REASON",
            question: "Vì sao đơn hàng giao thất bại?"
        }
    ];
};