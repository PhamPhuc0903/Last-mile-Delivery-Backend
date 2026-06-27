import express from "express";
import * as chatbotController from "../controllers/chatbot.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    uuidParamSchema,
    createSessionSchema,
    sendMessageSchema
} from "../validators/chatbot.validator.js";

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("CUSTOMER", "DRIVER", "ADMIN"));

router.post(
    "/session",
    validate(createSessionSchema),
    chatbotController.createSession
);

router.post(
    "/sessions",
    validate(createSessionSchema),
    chatbotController.createSession
);

router.get(
    "/sessions",
    chatbotController.getMySessions
);

router.get(
    "/history",
    chatbotController.getMySessions
);

router.get(
    "/suggestions",
    chatbotController.getSuggestedQuestions
);

router.get(
    "/session/:id/messages",
    validate(uuidParamSchema),
    chatbotController.getSessionById
);

router.get(
    "/sessions/:id",
    validate(uuidParamSchema),
    chatbotController.getSessionById
);

router.post(
    "/sessions/:id/messages",
    validate(uuidParamSchema),
    validate(sendMessageSchema),
    chatbotController.sendMessage
);

router.post(
    "/message",
    validate(sendMessageSchema),
    chatbotController.sendMessageWithoutSession
);

router.post(
    "/ask",
    validate(sendMessageSchema),
    chatbotController.sendMessageWithoutSession
);

router.patch(
    "/sessions/:id/close",
    validate(uuidParamSchema),
    chatbotController.closeSession
);

export default router;