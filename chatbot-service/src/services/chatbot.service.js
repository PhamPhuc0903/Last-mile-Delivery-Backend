import { generateChatbotAnswer } from "./llm.service.js";
import * as chatbotRepository from "../repositories/chatbot.repository.js";

const createHttpError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const getOrderContext = async (orderId, authorizationHeader) => {
    if (!orderId) {
        return null;
    }

    const orderServiceUrl =
        process.env.ORDER_SERVICE_URL || "http://localhost:3002";

    try {
        const response = await fetch(`${orderServiceUrl}/orders/${orderId}`, {
            headers: {
                Authorization: authorizationHeader || ""
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

const assertSessionOpen = (session) => {
    if (session.status === "CLOSED") {
        throw createHttpError("Chat session is closed", 400);
    }
};

export const createSession = async (userId, data = {}) => {
    const { orderId, title } = data;

    return chatbotRepository.createSession({
        userId,
        orderId,
        title
    });
};

export const getMySessions = async (userId) => {
    return chatbotRepository.findSessionsByUserId(userId);
};

export const getSessionById = async (userId, sessionId) => {
    const session = await chatbotRepository.findSessionByIdAndUserIdWithMessages({
        sessionId,
        userId
    });

    if (!session) {
        throw createHttpError("Chat session not found", 404);
    }

    return session;
};

export const sendMessage = async (
    userId,
    sessionId,
    { message, orderId } = {},
    authorizationHeader
) => {
    if (!message || !String(message).trim()) {
        throw createHttpError("message is required", 400);
    }

    let session;

    if (sessionId) {
        session = await chatbotRepository.findSessionByIdAndUserId({
            sessionId,
            userId
        });

        if (!session) {
            throw createHttpError("Chat session not found", 404);
        }

        assertSessionOpen(session);

        if (session.orderId && orderId && session.orderId !== orderId) {
            throw createHttpError(
                "orderId does not match this chat session",
                400
            );
        }

        if (!session.orderId && orderId) {
            session = await chatbotRepository.updateSessionOrderId({
                sessionId: session.id,
                orderId
            });
        }
    } else {
        session = await chatbotRepository.createSession({
            userId,
            orderId: orderId || null,
            title: "Chat hỗ trợ đơn hàng"
        });
    }

    const finalOrderId = session.orderId || orderId || null;

    const orderContext = await getOrderContext(
        finalOrderId,
        authorizationHeader
    );

    const recentMessages = await chatbotRepository.findRecentMessagesBySessionId(
        session.id,
        6
    );

    const aiResult = await generateChatbotAnswer({
        question: String(message).trim(),
        orderContext,
        history: recentMessages.reverse()
    });

    return chatbotRepository.createUserAndBotMessages({
        sessionId: session.id,
        userMessageText: String(message).trim(),
        botMessageText: aiResult.answer,
        metadata: {
            provider: aiResult.provider,
            orderId: finalOrderId,
            hasOrderContext: Boolean(orderContext)
        }
    });
};

export const closeSession = async (userId, sessionId) => {
    const session = await chatbotRepository.findSessionByIdAndUserId({
        sessionId,
        userId
    });

    if (!session) {
        throw createHttpError("Chat session not found", 404);
    }

    if (session.status === "CLOSED") {
        return session;
    }

    return chatbotRepository.closeSession(sessionId);
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