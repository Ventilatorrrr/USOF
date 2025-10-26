import Comment from "../models/CommentModel.js";
import Post from "../models/PostModel.js";
import Like from "../models/LikeModel.js";
import User from "../models/UserModel.js";

export const getCommentById = async (req, res) => {
    try {
        const { comment_id } = req.params;
        const comment = await Comment.getById(comment_id);
        if (!comment) return res.status(404).json({ error: "Comment not found" });
        res.json(comment);
    } catch (err) {
        console.error("getCommentById error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const createComment = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { post_id } = req.params;
        const { content, parent_id } = req.body;

        if (!userId) return res.status(401).json({ error: "Unauthorized" });
        if (!content?.trim()) return res.status(400).json({ error: "Content required" });

        const { id: newId, total } = await Comment.createAndSync({
            author_id: userId,
            post_id,
            parent_id: parent_id || null,
            content,
        });

        const newComment = await Comment.getById(newId);
        res.status(201).json({ ...newComment, total });
    } catch (err) {
        console.error("createComment error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const getLikes = async (req, res) => {
    try {
        const { comment_id } = req.params;

        const comment = await Comment.getById(comment_id);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        const likes = await Like.getCommentLikes(comment_id);

        if (!Array.isArray(likes) || likes.length === 0) {
            return res.status(404).json({ error: "No likes for this comment" });
        }

        res.json(likes);
    } catch (err) {
        console.error("getLikes error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const addLike = async (req, res) => {
    try {
        const comment_id = Number(req.params.comment_id);
        const user_id = req.user?.id;
        const { is_like } = req.body;

        if (!user_id) return res.status(401).json({ error: "Unauthorized" });
        if (!comment_id || typeof is_like !== "boolean") {
            return res.status(400).json({ error: "comment_id and boolean is_like required" });
        }

        const toggle = await Like.toggleCommentLike({ comment_id, user_id, is_like });

        const comment = await Comment.getById(comment_id);

        if (comment?.author_id) {
            await User.recalcRating(comment.author_id);
        }

        const counts = await Like.getCommentLikeCounts(comment_id);

        return res.json({
            comment_id,
            author_id: comment?.author_id || null,
            is_like: toggle.is_like,
            is_liked: toggle.is_like === true,
            is_disliked: toggle.is_like === false,
            likes_count: Number(counts.likes) || comment.likes_count || 0,
            dislikes_count: Number(counts.dislikes) || comment.dislikes_count || 0,
        });
    } catch (err) {
        console.error("addLike error stack:", err.stack || err);
        res.status(500).json({ error: "Server error", details: err.message });
    }
};

export const updateCommentStatus = async (req, res) => {
    try {
        const { comment_id } = req.params;
        const { status_comment } = req.body;

        if (!["active", "inactive"].includes(status_comment)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        await Comment.updateStatus(comment_id, status_comment);
        res.json({ message: "Comment status updated" });
    } catch (err) {
        console.error("updateCommentStatus error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const commentId = Number(req.params.comment_id);
        const userId = req.user.id;
        const role = req.user.role;

        const comment = await Comment.getById(commentId);
        if (!comment) return res.status(404).json({ error: "Comment not found" });

        if (comment.author_id !== userId && role !== "admin") {
            return res.status(403).json({ error: "Forbidden" });
        }

        const postId = comment.post_id;
        const authorId = comment.author_id;

        await Comment.delete(commentId, role);

        await Post.decComments(postId);

        await User.recalcRating(authorId);

        return res.json({ message: "Comment deleted successfully" });

    } catch (err) {
        console.error("deleteComment error:", err);
        res.status(500).json({ error: "Server error" });
    }
};


export const deleteLike = async (req, res) => {
    try {
        const comment_id = Number(req.params.comment_id);
        const user_id = req.user.id;

        if (!user_id) return res.status(401).json({ error: "Unauthorized" });
        if (!comment_id) return res.status(400).json({ error: "comment_id required" });

        const counts = await Like.removeCommentLike(comment_id, user_id);

        const comment = await Comment.getById(comment_id);
        if (comment?.author_id) {
            await User.recalcRating(comment.author_id);
        }

        return res.json({
            commentId: comment_id,
            author_id: comment?.author_id || null,
            is_liked: false,
            is_disliked: false,
            likes_count: counts?.likes ?? 0,
            dislikes_count: counts?.dislikes ?? 0,
        });
    } catch (err) {
        console.error("deleteLike error:", err);
        res.status(500).json({ error: "Server error", details: err.message });
    }
};

export const reportComment = async (req, res) => {
    try {
        const { reason } = req.body;
        const { comment_id } = req.params;
        const userId = req.user.id;

        await Comment.addReport(userId, comment_id, reason);

        const count = await Comment.getReportCount(comment_id);

        if (count >= 3) {
            await Comment.delete(comment_id);
            return res.json({ message: "Comment deleted due to multiple reports" });
        }

        res.json({ message: "Report submitted successfully" });
    } catch (err) {
        console.error("reportComment error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const lockComment = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const comment = await Comment.getById(id);
        if (!comment) return res.status(404).json({ error: "Comment not found" });

        if (user.id !== comment.author_id && user.role !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }

        await Comment.lock(id);
        res.json({ message: "Comment locked successfully", is_locked: true });
    } catch (err) {
        console.error("lockComment error:", err);
        res.status(500).json({ error: "Failed to lock comment" });
    }
};

export const unlockComment = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const comment = await Comment.getById(id);
        if (!comment) return res.status(404).json({ error: "Comment not found" });

        if (user.id !== comment.author_id && user.role !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }

        await Comment.unlock(id);
        res.json({ message: "Comment unlocked successfully", is_locked: false });
    } catch (err) {
        console.error("unlockComment error:", err);
        res.status(500).json({ error: "Failed to unlock comment" });
    }
};