import { Router } from "express";
import * as categoryController from "../controllers/categoryController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = Router();

router.get('/', categoryController.getAllCategories);
router.get('/:category_id', categoryController.getCategoryById);
router.get('/:category_id/posts', categoryController.getCategoryPosts);

router.post('/', authMiddleware, roleMiddleware(['admin']), categoryController.createCategory);
router.patch('/:category_id', authMiddleware, roleMiddleware(['admin']), categoryController.updateCategory);
router.delete('/:category_id', authMiddleware, roleMiddleware(['admin']), categoryController.deleteCategory);

export default router;
