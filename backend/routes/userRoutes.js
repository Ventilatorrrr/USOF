import { Router } from "express";
import * as userController from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import uploadAvatar from "../utils/uploadAvatar.js";

const router = Router();

router.get('/', userController.getAllUsers);
router.patch("/login", authMiddleware, userController.updateLogin);
router.patch('/:user_id/avatar', authMiddleware, roleMiddleware(['admin']), uploadAvatar.single('avatar'), userController.updateAvatarForUser);
router.patch('/socials', authMiddleware, userController.updateSocialLinks);
router.get('/:user_id', userController.getUserById);
router.post('/', authMiddleware, roleMiddleware(['admin']), userController.createUser);
router.patch('/avatar', authMiddleware, uploadAvatar.single('avatar'), userController.updateAvatar);
router.patch('/:user_id', authMiddleware, roleMiddleware(['admin']), userController.updateUser);
router.delete('/:user_id', authMiddleware, roleMiddleware(['admin']), userController.deleteUser);

export default router;
