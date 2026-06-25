import express from "express";
import * as chatbotController from "../controllers/chatbot.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post(
    "/session",
    authMiddleware,
    chatbotController.createSession
);

router.post(
    "/sessions",
    authMiddleware,
    chatbotController.createSession
);

router.get(
    "/sessions",
    authMiddleware,
    chatbotController.getMySessions
);

router.get(
    "/history",
    authMiddleware,
    chatbotController.getMySessions
);

router.get(
    "/suggestions",
    authMiddleware,
    chatbotController.getSuggestedQuestions
);

router.get(
    "/session/:id/messages",
    authMiddleware,
    chatbotController.getSessionById
);

router.get(
    "/sessions/:id",
    authMiddleware,
    chatbotController.getSessionById
);

router.post(
    "/sessions/:id/messages",
    authMiddleware,
    chatbotController.sendMessage
);

router.post(
    "/message",
    authMiddleware,
    chatbotController.sendMessageWithoutSession
);

router.post(
    "/ask",
    authMiddleware,
    chatbotController.sendMessageWithoutSession
);

router.patch(
    "/sessions/:id/close",
    authMiddleware,
    chatbotController.closeSession
);

export default router;