import Comment from "../models/CommentModel.js";
import Post from "../models/PostModel.js";
import Like from "../models/LikeModel.js";
import User from "../models/UserModel.js";

export const getAllPosts = async (req, res) => {
    try {
        const user = await Post.getUserFromToken(req.headers.authorization);
        const currentUserId = user?.id || 0;
        const isAdmin = user?.role === "admin";

        const {
            page = 1,
            limit = 20,
            sort = "likes",
            categoryId,
            fromDate,
            toDate,
            status,
            author_id,
            liked_by,
            favorited_by,
        } = req.query;

        const filters = {
            categoryId,
            fromDate,
            toDate,
            status: isAdmin ? status : undefined,
        };

        if (author_id) filters.authorId = Number(author_id);

        if (liked_by) {
            const posts = await Post.findLikedByUser(Number(liked_by), { page, limit, sort });
            const totalCount = await Post.countLikedByUser(Number(liked_by));
            const totalPages = Math.max(1, Math.ceil(totalCount / limit));

            for (const post of posts) {
                const counts = await Like.getPostLikeCounts(post.id);
                post.likes_count = counts.likes;
                post.dislikes_count = counts.dislikes;
            }

            return res.json({ posts, totalPages });
        }

        if (favorited_by) {
            const posts = await Post.findFavoritedByUser(Number(favorited_by), { page, limit, sort });
            const totalCount = await Post.countFavoritedByUser(Number(favorited_by));
            const totalPages = Math.max(1, Math.ceil(totalCount / limit));

            for (const post of posts) {
                const counts = await Like.getPostLikeCounts(post.id);
                post.likes_count = counts.likes;
                post.dislikes_count = counts.dislikes;
                post.is_favorite = true;
            }

            return res.json({ posts, totalPages });
        }

        const posts = isAdmin
            ? await Post.findAllForAdmin({ page, limit, filters, sort, userId: currentUserId })
            : await Post.findVisibleForUser(currentUserId, { page, limit, filters, sort });

        for (const post of posts) {
            const counts = await Like.getPostLikeCounts(post.id);
            post.likes_count = counts.likes;
            post.dislikes_count = counts.dislikes;
        }

        const totalCount = await Post.countAllPosts(filters, isAdmin);
        const totalPages = Math.max(1, Math.ceil(totalCount / limit));

        return res.json({ posts, totalPages });
    } catch (err) {
        console.error("getAllPosts error:", err);
        res.status(500).json({ error: "Server error", details: err.message });
    }
};

export const getPostById = async (req, res) => {
    try {
        const { post_id } = req.params;

        const user = await Post.getUserFromToken(req.headers.authorization);
        const userId = user ? user.id : 0;
        const isAdmin = user?.role === "admin";

        const post = await Post.findByIdForUser(post_id, userId, { includeInactive: isAdmin });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        return res.json(post);
    } catch (err) {
        console.error("getPostById error:", err);
        res.status(500).json({ error: "Failed to fetch post" });
    }
};

export const getPostComments = async (req, res) => {
    try {
        const { post_id } = req.params;

        const user = await Post.getUserFromToken(req.headers.authorization);
        const userId = user ? user.id : 0;

        const comments = await Comment.getAllByPost(post_id, userId);
        res.json(comments);
    } catch (err) {
        console.error("getPostComments error:", err);
        res.status(500).json({ error: "Failed to fetch comments" });
    }
};

export const getPostCategories = async (req, res) => {
    try {
        const { post_id } = req.params;

        const post = await Post.findById(post_id);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const categories = await Post.getCategories(post_id);
        res.json(categories);
    } catch (err) {
        console.error("getPostCategories error:", err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getPostLikes = async (req, res) => {
    try {
        const { post_id } = req.params;

        const post = await Post.findById(post_id);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const likes = await Like.getPostLikes(post_id);
        res.json(likes);
    } catch (err) {
        console.error("getPostLikes error:", err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const createPost = async (req, res) => {
    try {
        const { title, content, categories } = req.body;
        if (!title || !content) return res.status(400).json({ error: 'Missing fields' });

        const id = await Post.create({
            author_id: req.user.id,
            title,
            content,
            categories
        });

        res.status(201).json({ message: 'Post created', id });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const likePost = async (req, res) => {
    try {
        const userId = req.user?.id;
        const postId = Number(req.params.post_id);
        const { is_like } = req.body;

        if (!userId) return res.status(401).json({ error: "Unauthorized" });
        if (!postId || typeof is_like !== "boolean") {
            return res.status(400).json({ error: "post_id and boolean is_like required" });
        }

        await Like.togglePostLike({ post_id: postId, user_id: userId, is_like });

        const post = await Post.findById(postId);
        if (post?.author_id) {
            await User.recalcRating(post.author_id);
        }

        const counts = await Like.getPostLikeCounts(postId);

        return res.json({
            postId,
            author_id: post?.author_id || null,
            is_like,
            is_liked: is_like === true,
            is_disliked: is_like === false,
            likes_count: counts.likes,
            dislikes_count: counts.dislikes
        });

    } catch (e) {
        console.error("likePost error:", e);
        res.status(500).json({ error: "Server error" });
    }
};

export const updatePost = async (req, res) => {
    try {
        const { post_id } = req.params;
        const user = req.user;

        if (user.role === "admin") {
            await Post.updateByAdmin(post_id, req.body);
            const updated = await Post.findById(post_id, { includeInactive: true });
            return res.json({ message: "Post updated by admin", post: updated });
        }

        const updatedPost = await Post.updateByAuthor(post_id, user.id, req.body);
        if (!updatedPost) return res.status(404).json({ error: "Post not found" });

        res.json({ message: "Post updated successfully", post: updatedPost });
    } catch (err) {
        console.error("updatePost error:", err);
        res.status(500).json({ error: err.message });
    }
};

export const deletePost = async (req, res) => {
    try {
        const postId = Number(req.params.post_id);

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        if (post.author_id !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ error: "Forbidden" });
        }

        const authorId = post.author_id;

        await Post.delete(postId);
        await User.recalcRating(authorId);

        return res.json({ message: "Post deleted successfully" });

    } catch (err) {
        console.error("deletePost error stack:", err.stack || err);
        res.status(500).json({ error: "Server error" });
    }
};

export const deletePostLike = async (req, res) => {
    try {
        const userId = req.user?.id;
        const postId = Number(req.params.post_id);
        if (!userId) return res.status(401).json({ error: "Unauthorized" });
        if (!postId) return res.status(400).json({ error: "post_id required" });

        const counts = await Like.removePostLike(postId, userId);

        const post = await Post.findById(postId);
        if (post?.author_id) {
            await User.recalcRating(post.author_id);
        }

        return res.json({
            postId,
            author_id: post?.author_id || null,
            is_liked: false,
            is_disliked: false,
            likes_count: counts?.likes ?? 0,
            dislikes_count: counts?.dislikes ?? 0
        });
    } catch (e) {
        console.error("deletePostLike error:", e);
        res.status(500).json({ error: "Server error" });
    }
};

export const favoritePost = async (req, res) => {
    try {
        const { post_id } = req.params;
        const userId = req.user.id;

        const post = await Post.findById(post_id);
        if (!post) return res.status(404).json({ error: "Post not found" });

        await Post.addFavorite(post_id, userId);

        res.json({ postId: Number(post_id), is_favorite: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

export const unfavoritePost = async (req, res) => {
    try {
        const { post_id } = req.params;
        const userId = req.user.id;

        const post = await Post.findById(post_id);
        if (!post) return res.status(404).json({ error: "Post not found" });

        await Post.removeFavorite(post_id, userId);

        res.json({ postId: Number(post_id), is_favorite: false });
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

export const reportPost = async (req, res) => {
    try {
        const { reason } = req.body;
        const { post_id } = req.params;
        const userId = req.user.id;

        await Post.addReport(userId, post_id, reason);

        const count = await Post.getReportCount(post_id);

        if (count >= 3) {
            await Post.deactivate(post_id);
            return res.json({ message: "Post deactivated due to multiple reports" });
        }

        res.json({ message: "Report submitted successfully" });
    } catch (err) {
        console.error("reportPost error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const searchPosts = async (req, res) => {
    try {
        const q = req.query.q?.trim();
        if (!q) return res.json([]);

        let results = await Post.search(q);

        if (!Array.isArray(results)) results = [results];

        res.json(results);
    } catch (err) {
        console.error("Search error:", err);
        res.status(500).json({ error: "Search failed" });
    }
};

export const lockPost = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ error: "Post not found" });

        if (user.id !== post.author_id && user.role !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }

        await Post.lock(id);
        res.json({ message: "Post locked successfully", is_locked: true });
    } catch (err) {
        console.error("lockPost error:", err);
        res.status(500).json({ error: "Failed to lock post" });
    }
};

export const unlockPost = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ error: "Post not found" });

        if (user.id !== post.author_id && user.role !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }

        await Post.unlock(id);
        res.json({ message: "Post unlocked successfully", is_locked: false });
    } catch (err) {
        console.error("unlockPost error:", err);
        res.status(500).json({ error: "Failed to unlock post" });
    }
};

export const getAllReports = async (req, res) => {
    try {
        const reports = await Post.getAllReports();
        res.json(reports);
    } catch (err) {
        console.error("getAllReports error:", err);
        res.status(500).json({ error: "Failed to fetch reports" });
    }
};
