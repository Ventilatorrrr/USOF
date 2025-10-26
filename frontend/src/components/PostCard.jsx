import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    likePost,
    deletePostLike,
    favoritePost,
    unfavoritePost,
    updatePost,
    deletePost,
    reportPost,
    lockPost,
    unlockPost
} from "../redux/slices/postSlice";
import { createComment, fetchCommentsByPost } from "../redux/slices/commentSlice";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import EditPostForm from "../utils/EditPostForm";
import { fetchPostById } from "../redux/slices/postSlice";

import likeIcon from "../assets/images/interaction/like-false.png";
import dislikeIcon from "../assets/images/interaction/dislike-false.png";
import likeActive from "../assets/images/interaction/like-true.png";
import dislikeActive from "../assets/images/interaction/dislike-true.png";
import commentIcon from "../assets/images/interaction/comment.png";
import moreIcon from "../assets/images/interaction/more-icon.png";
import favoriteIcon from "../assets/images/interaction/favorite-false.png";
import favoriteActive from "../assets/images/interaction/favorite-true.png";
import defaultAvatar from "../assets/images/logo/avatar-default.png";
import editIcon from "../assets/images/interaction/edit-icon.png";
import deleteIcon from "../assets/images/interaction/remove-icon.png";
import activateIcon from "../assets/images/interaction/activate-icon.png";
import deactivateIcon from "../assets/images/interaction/deactivate-icon.png";
import reportIcon from "../assets/images/interaction/report.png";
import lockIcon from "../assets/images/interaction/lockIcon.png";
import unlockIcon from "../assets/images/interaction/unlockIcon.png";

import "./PostCard.css";

export default function PostCard({
                                     post,
                                     className = "",
                                     onToggleFavorite,
                                     onCommentCreated,
                                     showMenu = true,
                                 }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const authUser = useSelector((s) => s.auth?.user);
    const totalsByPost = useSelector((s) => s.comments?.totals || {});
    const totalComments = totalsByPost[post.id] ?? post.comments_count ?? 0;

    const [isPending, setIsPending] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);

    if (!post) return null;

    const isActive = post.status_post === "active";

    const requireAuth = () => {
        if (!authUser) {
            navigate("/login");
            return false;
        }
        return true;
    };

    let formattedDate = "";
    try {
        if (post.publish_date) {
            formattedDate = new Date(post.publish_date).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        }
    } catch {
        formattedDate = "";
    }

    const authorLogin =
        post.author?.login || post.author_login || post.login || "Unknown";

    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const base = API_URL.replace(/\/+$/, "").replace(/\/api$/, "");
    const rawAvatar =
        post.author?.id === authUser?.id
            ? authUser?.profile_picture || authUser?.avatar
            : post.author?.avatar || post.author?.profile_picture;
    const finalAvatar = rawAvatar
        ? rawAvatar.startsWith("http")
            ? rawAvatar
            : `${base}/${rawAvatar.replace(/^\/+/, "")}`
        : defaultAvatar;

    // Улюблене
    const handleFavorite = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (post.is_locked) return;
        if (!requireAuth()) return;
        if (isPending) return;
        setIsPending(true);
        try {
            if (post.is_favorite) {
                await dispatch(unfavoritePost(post.id)).unwrap();
                onToggleFavorite?.(post.id, false);
            } else {
                await dispatch(favoritePost(post.id)).unwrap();
                onToggleFavorite?.(post.id, true);
            }
        } finally {
            setIsPending(false);
        }
    };

    // Лайк
    const handleLike = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (post.is_locked) return;
        if (!requireAuth()) return;
        if (isPending) return;
        setIsPending(true);
        try {
            if (post.is_liked) {
                await dispatch(deletePostLike(post.id)).unwrap();
            } else {
                await dispatch(likePost({ postId: post.id, is_like: true })).unwrap();
            }
        } finally {
            setIsPending(false);
        }
    };

    // Дизлайк
    const handleDislike = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (post.is_locked) return;
        if (!requireAuth()) return;
        if (isPending) return;
        setIsPending(true);
        try {
            if (post.is_disliked) {
                await dispatch(deletePostLike(post.id)).unwrap();
            } else {
                await dispatch(likePost({ postId: post.id, is_like: false })).unwrap();
            }
        } finally {
            setIsPending(false);
        }
    };

    // Коментар
    const handleCreateComment = async (e) => {
        e.preventDefault();
        if (!requireAuth()) return;
        if (post.is_locked) return;
        if (!authUser || !newComment.trim()) return;
        try {
            setIsSubmitting(true);
            const result = await dispatch(
                createComment({ postId: post.id, content: newComment })
            ).unwrap();
            setNewComment("");
            setShowForm(false);
            const newCount = result?.total ?? (post.comments_count + 1);
            onCommentCreated?.(post.id, newCount);
            dispatch(fetchCommentsByPost(post.id));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Форма
    const toggleForm = () => setShowForm((p) => !p);

    // ⋮ Меню або перехід
    const handleMoreClick = (e) => {
        e.stopPropagation();
        const isAuthor = authUser && authUser.id === post.author_id;
        const isAdmin = authUser && authUser.role === "admin";

        if (post.is_locked && !isAuthor && !isAdmin) return;

        if (showMenu) {
            setIsMenuOpen((p) => !p);
        } else {
            const isFromProfile = window.location.pathname.startsWith("/profile");
            navigate(`/post/${post.id}?from=profile`);
        }
    };

    return (
        <div className="post-wrapper">
            <div className={`post-card ${className}`}>
                <div className="post-main">
                    {/* Favorite */}
                    <div
                        className={`favorite-icon ${post.is_favorite ? "active" : ""}`}
                        onClick={handleFavorite}
                    >
                        <img
                            src={post.is_favorite ? favoriteActive : favoriteIcon}
                            alt="favorite"
                            className="icon"
                        />
                    </div>

                    {/* Автор */}
                    <div className="post-author-row">
                        <img
                            src={finalAvatar}
                            alt={`${authorLogin} avatar`}
                            className="author-avatar"
                            onError={(e) => (e.target.src = defaultAvatar)}
                            onClick={() => {
                                if (post.author_id && post.author_id !== authUser?.id) {
                                    navigate(`/user/${post.author_id}`);
                                } else {
                                    navigate("/profile");
                                }
                            }}
                            style={{ cursor: "pointer" }}
                        />
                        <div className="author-meta">
                            <span className="author-name">{authorLogin}</span>
                            <span className={`status-symbol ${isActive ? "active" : "inactive"}`}>
                ⚬
              </span>
                            <span className="post-date">{formattedDate}</span>
                        </div>
                    </div>

                    {/* Контент */}
                    <div className="post-title">
                        {post.title}
                        {post.is_locked ? (
                            <img
                                src={lockIcon}
                                alt="Locked"
                                className="lock-symbol"
                                title="This post is locked"
                            />
                        ) : null}
                    </div>

                    <div className="post-content">
                        {post.content}
                    </div>

                    <div className="post-divider" />

                    {/* Footer */}
                    <div className="post-footer">
                        <div className="footer-left">
                            <div
                                className={`icon-item like ${post.is_liked ? "active" : ""}`}
                                onClick={handleLike}
                            >
                                <img
                                    src={post.is_liked ? likeActive : likeIcon}
                                    alt="like"
                                    className="icon"
                                />
                                <span className="count">{Number(post.likes_count ?? 0)}</span>
                            </div>
                            <div
                                className={`icon-item dislike ${post.is_disliked ? "active" : ""}`}
                                onClick={handleDislike}
                            >
                                <img
                                    src={post.is_disliked ? dislikeActive : dislikeIcon}
                                    alt="dislike"
                                    className="icon"
                                />
                                <span className="count">{Number(post.dislikes_count ?? 0)}</span>
                            </div>
                        </div>

                        <div className="footer-right">
                            <div className="icon-item" title="Comments" onClick={toggleForm}>
                                <img src={commentIcon} alt="comment" className="icon" />
                                <span className="count">{totalComments}</span>
                            </div>

                            <div className="more-wrapper">
                                <div className="icon-item more-button" title="More" onClick={handleMoreClick}>
                                    <img src={moreIcon} alt="more" className="icon" />
                                </div>

                                {showMenu && isMenuOpen && (
                                    <div className="post-menu">
                                        {(authUser?.id === post.author_id || authUser?.role === "admin") && (
                                            <>
                                                <button className="menu-item" onClick={() => setIsEditOpen(true)} title="Edit">
                                                    <img src={editIcon} alt="edit" className="menu-icon" />
                                                </button>
                                                <button className="menu-item" onClick={() => setIsDeleteOpen(true)} title="Delete">
                                                    <img src={deleteIcon} alt="delete" className="menu-icon" />
                                                </button>
                                                <button
                                                    className="menu-item"
                                                    onClick={async () => {
                                                        try {
                                                            if (post.is_locked) {
                                                                await dispatch(unlockPost(post.id)).unwrap();
                                                            } else {
                                                                await dispatch(lockPost(post.id)).unwrap();
                                                            }
                                                            setIsMenuOpen(false);
                                                        } catch (err) {
                                                            console.error("Lock toggle error:", err);
                                                        }
                                                    }}
                                                    title={post.is_locked ? "Unlock Post" : "Lock Post"}
                                                >
                                                    <img
                                                        src={post.is_locked ? unlockIcon : lockIcon}
                                                        alt="lock"
                                                        className="menu-icon"
                                                    />
                                                </button>
                                                <button className="menu-item" onClick={() => setIsStatusOpen(true)} title="Toggle status">
                                                    <img
                                                        src={post.status_post === "active" ? deactivateIcon : activateIcon}
                                                        alt="toggle"
                                                        className="menu-icon"
                                                    />
                                                </button>
                                            </>
                                        )}
                                        {authUser?.role !== "admin" && authUser?.id !== post.author_id && (
                                            <button className="menu-item" onClick={() => setIsReportOpen(true)} title="Report">
                                                <img src={reportIcon} alt="report" className="menu-icon" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Категорії */}
                <aside className="post-categories">
                    {Array.isArray(post.categories) && post.categories.length > 0 ? (
                        post.categories.slice(0, 4).map((cat, idx) => (
                            <div
                                key={`${cat?.id ?? cat?.title ?? "cat"}-${post.id}-${idx}`}
                                className="category-row"
                            >
                                {cat?.title ?? "Unnamed"}
                            </div>
                        ))
                    ) : (
                        <div className="category-row empty">No categories</div>
                    )}
                </aside>
            </div>

            {/* Форма коментаря */}
            {showForm && (
                <form className="new-comment-form" onSubmit={handleCreateComment}>
          <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onFocus={() => {
                  if (!authUser) navigate("/login");
              }}
              placeholder={
                  authUser ? "Write your comment..." : "Please log in to comment"
              }
              disabled={post.is_locked || !authUser || isSubmitting}
          />
                    <button
                        type="submit"
                        disabled={post.is_locked || !authUser || isSubmitting || !newComment.trim()}
                    >
                        {isSubmitting ? "Posting..." : "Post Comment"}
                    </button>
                </form>
            )}

            {isEditOpen && (
                <Modal title="Edit Post" onClose={() => setIsEditOpen(false)}>
                    <EditPostForm
                        post={post}
                        onClose={() => setIsEditOpen(false)}
                        isAdmin={authUser?.role === "admin"}
                    />
                </Modal>
            )}

            {isDeleteOpen && (
                <Modal title="Delete Post" onClose={() => setIsDeleteOpen(false)}>
                    <p>Are you sure you want to delete this post?</p>
                    <button
                        onClick={() => {
                            dispatch(deletePost(post.id));
                            setIsDeleteOpen(false);
                        }}
                        className="delete-btn"
                    >
                        Delete
                    </button>
                </Modal>
            )}

            {isStatusOpen && (
                <Modal title="Change Status" onClose={() => setIsStatusOpen(false)}>
                    <p>
                        {post.status_post === "active"
                            ? "Deactivate this post?"
                            : "Activate this post?"}
                    </p>
                    <button
                        onClick={async () => {
                            try {
                                await dispatch(
                                    updatePost({
                                        postId: post.id,
                                        updates: {
                                            status_post:
                                                post.status_post === "active" ? "inactive" : "active",
                                        },
                                    })
                                ).unwrap();

                                await dispatch(fetchPostById(post.id)).unwrap();
                            } catch (err) {
                                console.error("Failed to update post status:", err);
                            } finally {
                                setIsStatusOpen(false);
                            }
                        }}
                        className="save-btn"
                    >
                        Confirm
                    </button>
                </Modal>
            )}

            {isReportOpen && (
                <Modal title="Report Post" onClose={() => setIsReportOpen(false)}>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!requireAuth()) return;
                            const reason = e.target.reason.value.trim();
                            if (reason) {
                                dispatch(reportPost({ postId: post.id, reason }));
                                setIsReportOpen(false);
                            }
                        }}
                    >
                        <label>Reason:</label>
                        <textarea name="reason" placeholder="Enter your report reason" />
                        <button type="submit" className="save-btn">Send Report</button>
                    </form>
                </Modal>
            )}

        </div>
    );
}
