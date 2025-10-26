import { Router } from "express";
import * as postController from "../controllers/postController.js";
import * as commentController from "../controllers/commentController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.get('/', postController.getAllPosts);
router.get('/search', postController.searchPosts);
router.get('/:post_id', postController.getPostById);
router.get('/:post_id/comments', postController.getPostComments);
router.get('/:post_id/categories', postController.getPostCategories);
router.get('/:post_id/like', postController.getPostLikes);

router.get('/admin/reports', authMiddleware, postController.getAllReports);
router.post('/', authMiddleware, postController.createPost);
router.post('/:post_id/comments', authMiddleware, commentController.createComment);
router.post('/:post_id/like', authMiddleware, postController.likePost);
router.post('/:post_id/favorite', authMiddleware, postController.favoritePost);
router.post('/:post_id/report', authMiddleware, postController.reportPost);
router.delete('/:post_id/favorite', authMiddleware, postController.unfavoritePost);
router.patch('/:post_id', authMiddleware, postController.updatePost);
router.delete('/:post_id', authMiddleware, postController.deletePost);
router.delete('/:post_id/like', authMiddleware, postController.deletePostLike);
router.patch('/:id/lock', authMiddleware, postController.lockPost);
router.patch('/:id/unlock', authMiddleware, postController.unlockPost);

export default router;
