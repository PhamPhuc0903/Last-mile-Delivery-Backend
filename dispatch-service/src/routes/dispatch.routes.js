import express from "express";
import * as dispatchController from "../controllers/dispatch.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    assignmentIdParamSchema,
    createAssignmentSchema,
    autoAssignSchema,
    rejectAssignmentSchema,
    cancelAssignmentSchema
} from "../validators/dispatch.validator.js";

const router = express.Router();

router.post(
    "/assign",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(createAssignmentSchema),
    dispatchController.createAssignment
);

router.post(
    "/auto-assign",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(autoAssignSchema),
    dispatchController.autoAssign
);

router.get(
    "/history",
    authMiddleware,
    roleMiddleware("ADMIN"),
    dispatchController.getAssignments
);

router.post(
    "/assignments",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(createAssignmentSchema),
    dispatchController.createAssignment
);

router.post(
    "/assignments/auto",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(autoAssignSchema),
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
    roleMiddleware("ADMIN"),
    validate(assignmentIdParamSchema),
    dispatchController.getAssignmentById
);

router.patch(
    "/assignments/:id/accept",
    authMiddleware,
    roleMiddleware("DRIVER"),
    validate(assignmentIdParamSchema),
    dispatchController.acceptAssignment
);

router.patch(
    "/assignments/:id/reject",
    authMiddleware,
    roleMiddleware("DRIVER"),
    validate(rejectAssignmentSchema),
    dispatchController.rejectAssignment
);

router.patch(
    "/assignments/:id/cancel",
    authMiddleware,
    roleMiddleware("ADMIN"),
    validate(cancelAssignmentSchema),
    dispatchController.cancelAssignment
);

router.patch(
    "/assignments/:id/complete",
    authMiddleware,
    roleMiddleware("DRIVER", "ADMIN"),
    validate(assignmentIdParamSchema),
    dispatchController.completeAssignment
);

export default router;