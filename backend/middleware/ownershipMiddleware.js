// middleware/ownershipMiddleware.js
import Post from "../models/PostModel.js";
import Comment from "../models/CommentModel.js";

export default function ownershipMiddleware(entity) {
    return async (req, res, next) => {
        try {
            if (entity === "post") {
                const post = await Post.findByIdForUser(
                    req.params.post_id,
                    req.user.id,
                    { includeInactive: true }
                );
                if (!post) return res.status(404).json({ error: "Post not found" });

                if (post.author_id !== req.user.id && req.user.role !== "admin") {
                    return res.status(403).json({ error: "Forbidden" });
                }
            }

            if (entity === "comment") {
                const comment = await Comment.getById(req.params.comment_id);
                if (!comment) return res.status(404).json({ error: "Comment not found" });

                if (comment.author_id !== req.user.id && req.user.role !== "admin") {
                    return res.status(403).json({ error: "Forbidden" });
                }
            }

            next();
        } catch (err) {
            console.error("ownershipMiddleware error:", err);
            res.status(500).json({ error: "Server error" });
        }
    };
}