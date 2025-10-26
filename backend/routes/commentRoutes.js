import { Router } from "express";
import * as commentController from "../controllers/commentController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.get('/:comment_id', commentController.getCommentById);
router.get('/:comment_id/like', commentController.getLikes);

router.post('/:comment_id/like', authMiddleware, commentController.addLike);
router.post('/:comment_id/report', authMiddleware, commentController.reportComment);
router.patch('/:comment_id', authMiddleware, commentController.updateCommentStatus);
router.delete('/:comment_id', authMiddleware, commentController.deleteComment);
router.delete('/:comment_id/like', authMiddleware, commentController.deleteLike);

router.patch('/:id/lock', authMiddleware, commentController.lockComment);
router.patch('/:id/unlock', authMiddleware, commentController.unlockComment);

export default router;
