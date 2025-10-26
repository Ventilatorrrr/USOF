import { Router } from "express";
import * as authController from "../controllers/authController.js";
import fieldsMiddleware from "../middleware/fieldsMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", fieldsMiddleware("login", "password", "password_confirmation", "email"), authController.register);
router.post("/login", fieldsMiddleware("loginOrEmail", "password"), authController.login);
router.post("/logout", authMiddleware, authController.logout);
router.post("/password-reset", fieldsMiddleware("email"), authController.passwordResetRequest);
router.post("/password-reset/:confirm_token", fieldsMiddleware("newPassword"), authController.passwordResetConfirm);
router.get("/confirm-email/:token", authController.confirmEmail);

export default router;
