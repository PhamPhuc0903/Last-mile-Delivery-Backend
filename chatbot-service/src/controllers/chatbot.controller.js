import * as chatbotService from "../services/chatbot.service.js";

export const createSession = async (req, res) => {
    try {
        const session = await chatbotService.createSession(req.user.id, req.body);

        res.status(201).json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error("Create chat session error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const getMySessions = async (req, res) => {
    try {
        const sessions = await chatbotService.getMySessions(req.user.id);

        res.status(200).json({
            success: true,
            data: sessions
        });
    } catch (error) {
        console.error("Get chat sessions error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const getSessionById = async (req, res) => {
    try {
        const session = await chatbotService.getSessionById(
            req.user.id,
            req.params.id
        );

        res.status(200).json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error("Get chat session error:", error);

        res.status(error.statusCode || 404).json({
            success: false,
            message: error.message
        });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const result = await chatbotService.sendMessage(
            req.user.id,
            req.params.id,
            req.body,
            req.headers.authorization
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Send chatbot message error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const sendMessageWithoutSession = async (req, res) => {
    try {
        const sessionId = req.body.sessionId || null;

        const result = await chatbotService.sendMessage(
            req.user.id,
            sessionId,
            req.body,
            req.headers.authorization
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Send chatbot message error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const closeSession = async (req, res) => {
    try {
        const session = await chatbotService.closeSession(
            req.user.id,
            req.params.id
        );

        res.status(200).json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error("Close chat session error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

export const getSuggestedQuestions = async (req, res) => {
    try {
        const suggestions = await chatbotService.getSuggestedQuestions();

        res.status(200).json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        console.error("Get chatbot suggestions error:", error);

        res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};