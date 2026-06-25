import express from "express";
import * as dispatchController from "../controllers/dispatch.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post(
    "/assignments",
    authMiddleware,
    roleMiddleware("ADMIN"),
    dispatchController.createAssignment
);

router.post(
    "/assignments/auto",
    authMiddleware,
    roleMiddleware("ADMIN"),
    dispatchController.autoAssign
);

router.get(
    "/assignments",
    authMiddleware,
    roleMiddleware("ADMIN"),
    dispatchController.getAssignments
);

router.get(
    "/my-assignments",
    authMiddleware,
    roleMiddleware("DRIVER"),
    dispatchController.getMyAssignments
);

router.get(
    "/my-current-assignment",
    authMiddleware,
    roleMiddleware("DRIVER"),
    dispatchController.getMyCurrentAssignment
);

router.get(
    "/my-history",
    authMiddleware,
    roleMiddleware("DRIVER"),
    dispatchController.getMyHistory
);

router.get(
    "/assignments/:id",
    authMiddleware,
    dispatchController.getAssignmentById
);

router.patch(
    "/assignments/:id/accept",
    authMiddleware,
    roleMiddleware("DRIVER"),
    dispatchController.acceptAssignment
);

router.patch(
    "/assignments/:id/reject",
    authMiddleware,
    roleMiddleware("DRIVER"),
    dispatchController.rejectAssignment
);

router.patch(
    "/assignments/:id/cancel",
    authMiddleware,
    roleMiddleware("ADMIN"),
    dispatchController.cancelAssignment
);

router.patch(
    "/assignments/:id/complete",
    authMiddleware,
    roleMiddleware("DRIVER", "ADMIN"),
    dispatchController.completeAssignment
);

router.post(
    "/assign",
    authMiddleware,
    roleMiddleware("ADMIN"),
    dispatchController.createAssignment
);

router.post(
    "/auto-assign",
    authMiddleware,
    roleMiddleware("ADMIN"),
    dispatchController.autoAssign
);

router.get(
    "/history",
    authMiddleware,
    roleMiddleware("ADMIN"),
    dispatchController.getAssignments
);

export default router;