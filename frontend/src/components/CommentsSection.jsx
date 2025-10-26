import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    createComment,
    addCommentLike,
    deleteCommentLike,
    deleteComment,
    updateCommentStatus,
    reportComment,
    lockComment,
    unlockComment
} from "../redux/slices/commentSlice";
import { useNavigate } from "react-router-dom";

import likeIcon from "../assets/images/interaction/like-false.png";
import dislikeIcon from "../assets/images/interaction/dislike-false.png";
import likeActive from "../assets/images/interaction/like-true.png";
import dislikeActive from "../assets/images/interaction/dislike-true.png";
import replyIcon from "../assets/images/interaction/comment.png";
import moreIcon from "../assets/images/interaction/more-icon.png";
import defaultAvatar from "../assets/images/logo/avatar-default.png";
import replyComment from "../assets/images/interaction/reply-comment.png";

import Modal from "../components/Modal";
import deleteIcon from "../assets/images/interaction/remove-icon.png";
import activateIcon from "../assets/images/interaction/activate-icon.png";
import deactivateIcon from "../assets/images/interaction/deactivate-icon.png";
import reportIcon from "../assets/images/interaction/report.png";
import lockIcon from "../assets/images/interaction/lockIcon.png";
import unlockIcon from "../assets/images/interaction/unlockIcon.png";

import "./CommentsSection.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const base = API_URL.replace(/\/+$/, "").replace(/\/api$/, "");

const getAvatarUrl = (avatar) => {
    if (!avatar) return defaultAvatar;
    if (avatar.startsWith("http")) return avatar;
    if (avatar.startsWith("/")) return `${base}${avatar}`;
    if (avatar.startsWith("uploads")) return `${base}/${avatar}`;
    return `${base}/${avatar}`;
};

export default function CommentsSection({ comments = [], postId }) {

    const safeComments = Array.isArray(comments) ? comments : [];

    const visibleComments = safeComments;

    return (
        <div className="comments-section">
            <h3 className="comments-title">Comments</h3>

            {visibleComments.length === 0 ? (
                <p className="no-comments">No comments yet.</p>
            ) : (
                visibleComments.map((c) => (
                    <CommentThread key={c.id} comment={c} postId={postId} />
                ))
            )}
        </div>
    );
}

function CommentThread({ comment, postId }) {
    const [showReplies, setShowReplies] = useState(false);
    const [replyCount, setReplyCount] = useState(0);

    useEffect(() => {
        const countAllReplies = (node) => {
            if (!node.replies || node.replies.length === 0) return 0;
            return node.replies.length + node.replies.reduce((sum, r) => sum + countAllReplies(r), 0);
        };
        const total = countAllReplies(comment);
        setReplyCount(total);
    }, [comment]);

    const toggleReplies = () => setShowReplies(!showReplies);

    const renderReplies = (list) => {
        if (!list || list.length === 0) return null;
        return list.map((r) => (
            <div key={r.id} className="reply-item">
                <CommentItem comment={r} postId={postId} isReply />
                {r.replies && r.replies.length > 0 && (
                    <div className="nested-reply">
                        {renderReplies(r.replies)}
                    </div>
                )}
            </div>
        ));
    };

    return (
        <div className="comment-thread">
            <CommentItem
                comment={comment}
                postId={postId}
                totalReplies={replyCount}
                onToggleReplies={toggleReplies}
                showReplies={showReplies}
            />

            {showReplies && replyCount > 0 && (
                <div className="replies-wrapper">
                    {renderReplies(comment.replies)}
                </div>
            )}
        </div>
    );
}

function CommentItem({
                         comment,
                         postId,
                         isReply = false,
                         totalReplies = 0,
                         onToggleReplies,
                         showReplies,
                     }) {
    const dispatch = useDispatch();
    const [showReplyBox, setShowReplyBox] = useState(false);
    const [replyText, setReplyText] = useState("");
    const navigate = useNavigate();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const authUser = useSelector((s) => s.auth?.user);
    const isAuthor = authUser && (authUser.id === comment.author_id || authUser.role === "admin");

    const requireAuth = () => {
        if (!authUser) {
            navigate("/login");
            return false;
        }
        return true;
    };

    const [localLikes, setLocalLikes] = useState(comment.likes_count || 0);
    const [localDislikes, setLocalDislikes] = useState(comment.dislikes_count || 0);
    const [userReaction, setUserReaction] = useState(
        comment.user_is_like === true || comment.user_is_like === 1
            ? "like"
            : comment.user_is_like === false || comment.user_is_like === 0
                ? "dislike"
                : null
    );

    const handleLike = async (id) => {
        if (!requireAuth()) return;
        if (comment.is_locked) return;

        if (userReaction === "like") {
            setUserReaction(null);
            setLocalLikes(prev => Math.max(Number(prev ?? 0) - 1, 0)); // 🧠 safe

            try {
                await dispatch(deleteCommentLike({ id, postId })).unwrap();
            } catch (err) {
                console.error("Error removing like:", err);
            }
            return;
        }

        try {
            const result = await dispatch(addCommentLike({ id, is_like: true })).unwrap();

            setLocalLikes(Number(result.likes_count ?? result.likes ?? localLikes ?? 0));
            setLocalDislikes(Number(result.dislikes_count ?? result.dislikes ?? localDislikes ?? 0));

            if (result.is_liked || result.is_like === true) setUserReaction("like");
            else if (result.is_disliked || result.is_like === false) setUserReaction("dislike");
            else setUserReaction(null);
        } catch (err) {
            console.error("Error liking comment:", err);
        }
    };

    const handleDislike = async (id) => {
        if (!requireAuth()) return;
        if (comment.is_locked) return;

        if (userReaction === "dislike") {
            setUserReaction(null);
            setLocalDislikes(prev => Math.max(Number(prev ?? 0) - 1, 0)); // 🧠 safe

            try {
                await dispatch(deleteCommentLike({ id, postId })).unwrap();
            } catch (err) {
                console.error("Error removing dislike:", err);
            }
            return;
        }

        try {
            const result = await dispatch(addCommentLike({ id, is_like: false })).unwrap();

            setLocalLikes(Number(result.likes_count ?? result.likes ?? localLikes ?? 0));
            setLocalDislikes(Number(result.dislikes_count ?? result.dislikes ?? localDislikes ?? 0));

            if (result.is_liked || result.is_like === true) setUserReaction("like");
            else if (result.is_disliked || result.is_like === false) setUserReaction("dislike");
            else setUserReaction(null);
        } catch (err) {
            console.error("Error disliking comment:", err);
        }
    };

    useEffect(() => {
        if (comment.user_is_like === true || comment.user_is_like === 1)
            setUserReaction("like");
        else if (comment.user_is_like === false || comment.user_is_like === 0)
            setUserReaction("dislike");
        else
            setUserReaction(null);
    }, [comment.user_is_like]);

    const handleReply = async () => {
        if (!requireAuth()) return;
        if (!replyText.trim()) return;
        try {
            await dispatch(
                createComment({
                    postId,
                    content: replyText.trim(),
                    parent_id: comment.id,
                })
            );
            setReplyText("");
            setShowReplyBox(false);
        } catch (err) {
            console.error("Error creating reply:", err);
        }
    };

    const authorLogin = comment.login || comment.author?.login || "Anonymous";
    const avatar = comment.profile_picture || comment.author?.profile_picture || defaultAvatar;
    const parentAuthor = comment.parent_login || comment.parent_author || null;

    const date = comment.publish_date
        ? new Date(comment.publish_date).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "";

    return (
        <div id={`comment-${comment.id}`}
             className={`comment-box ${isReply ? "is-reply" : ""}`}>
            <div className="comment-header">
                <div className="comment-author-row">
                    <img
                        src={getAvatarUrl(avatar)}
                        alt={`${authorLogin} avatar`}
                        className="comment-avatar"
                        onError={(e) => (e.target.src = defaultAvatar)}
                    />
                    <div className="comment-meta">
                        <span className="comment-author">{authorLogin}</span>
                        <span
                            className={`status-symbol ${
                                comment.status_comment === "active" ? "active" : "inactive"
                            }`}
                            title={comment.status_comment === "active" ? "Active" : "Inactive"}
                        >⚬</span>

                        {date && <span className="comment-date">{date}</span>}
                    </div>

                    {Number(comment.is_locked) === 1 && (
                        <img
                            src={lockIcon}
                            alt="locked"
                            className="icon lock-indicator"
                            title="This comment is locked"
                        />
                    )}

                </div>
            </div>

            {parentAuthor && (
                <div className="comment-replying">
                    <img src={replyComment} alt="replyComment" className="icon smally" />
                    Replying to <span className="reply-username">@{parentAuthor}</span>
                </div>
            )}

            <div className="comment-text">{comment.content || ""}</div>

            <div className="comment-footer">
                <div className="footer-left">
                    <div
                        className={`icon-item ${userReaction === "like" ? "active like" : ""}`}
                        onClick={() => handleLike(comment.id)}
                    >
                        <img
                            src={userReaction === "like" ? likeActive : likeIcon}
                            alt="like"
                            className="icon small"
                        />
                        <span className="count">{Number.isFinite(localLikes) ? localLikes : 0}</span>
                    </div>

                    <div
                        className={`icon-item ${userReaction === "dislike" ? "active dislike" : ""}`}
                        onClick={() => handleDislike(comment.id)}
                    >
                        <img
                            src={userReaction === "dislike" ? dislikeActive : dislikeIcon}
                            alt="dislike"
                            className="icon small"
                        />
                        <span className="count">{Number.isFinite(localDislikes) ? localDislikes : 0}</span>
                    </div>

                    <div
                        className={`icon-item reply-icon ${comment.status_comment !== "active" ? "disabled" : ""}`}
                        onClick={() => {
                            if (!requireAuth()) return;
                            if (comment.status_comment !== "active" || comment.is_locked) return;
                            setShowReplyBox(!showReplyBox);
                        }}
                        title={
                            comment.is_locked
                                ? "Replies are locked for this comment"
                                : comment.status_comment === "active"
                                    ? "Reply"
                                    : "Replies are disabled for inactive comments"
                        }
                    >
                        <img src={replyIcon} alt="reply" className="icon small" />
                    </div>

                </div>

                <div className="footer-right">
                    {!isReply && totalReplies > 0 && (
                        <button className="view-replies-btn" onClick={onToggleReplies}>
                            {showReplies
                                ? `Hide replies (${totalReplies})`
                                : `View replies (${totalReplies})`}
                        </button>
                    )}

                    <div className="more-wrapper">
                        <div
                            className="icon-item more-button"
                            title="More"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMenuOpen((p) => !p);
                            }}
                        >
                            <img src={moreIcon} alt="more" className="icon small" />
                        </div>

                        {isMenuOpen && (
                            <div className="comment-menu">
                                {isAuthor && (
                                    <>
                                        <button
                                            className="menu-item"
                                            onClick={() => setIsDeleteOpen(true)}
                                            title="Delete"
                                        >
                                            <img src={deleteIcon} alt="delete" className="menu-icon" />
                                        </button>
                                        <button
                                            className="menu-item"
                                            onClick={async () => {
                                                try {
                                                    if (comment.is_locked) {
                                                        await dispatch(unlockComment({ id: comment.id, postId })).unwrap();
                                                    } else {
                                                        await dispatch(lockComment({ id: comment.id, postId })).unwrap();
                                                    }
                                                    setIsMenuOpen(false);
                                                } catch (err) {
                                                    console.error("Lock comment error:", err);
                                                }
                                            }}
                                            title={comment.is_locked ? "Unlock comment" : "Lock comment"}
                                        >
                                            <img
                                                src={comment.is_locked ? unlockIcon : lockIcon}
                                                alt="lock"
                                                className="menu-icon"
                                            />
                                        </button>
                                        <button
                                            className="menu-item"
                                            onClick={() => setIsStatusOpen(true)}
                                            title="Toggle status"
                                        >
                                            <img
                                                src={comment.status_comment === "active" ? deactivateIcon : activateIcon}
                                                alt="toggle"
                                                className="menu-icon"
                                            />
                                        </button>
                                    </>
                                )}

                                <button
                                    className="menu-item"
                                    onClick={() => setIsReportOpen(true)}
                                    title="Report"
                                >
                                    <img src={reportIcon} alt="report" className="menu-icon" />
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {showReplyBox && (
                <div className="reply-box">
                    <textarea
                        className="reply-input"
                        placeholder={
                            comment.is_locked
                                ? "Replies are locked for this comment "
                                : `Reply to ${authorLogin}...`
                        }
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        disabled={comment.is_locked}
                    />
                    <button className="reply-btn" onClick={handleReply} disabled={comment.is_locked}>
                        Send
                    </button>
                </div>
            )}

            {isDeleteOpen && (
                <Modal title="Delete Comment" onClose={() => setIsDeleteOpen(false)}>
                    <p>Are you sure you want to delete this comment?</p>
                    <button
                        className="delete-btn"
                        onClick={async () => {
                            try {
                                await dispatch(deleteComment({ id: comment.id, postId })).unwrap();
                                setIsDeleteOpen(false);
                            } catch (err) {
                                console.error("Error deleting comment:", err);
                            }
                        }}
                    >
                        Delete
                    </button>
                </Modal>
            )}

            {isStatusOpen && (
                <Modal title="Change Status" onClose={() => setIsStatusOpen(false)}>
                    <p>
                        {comment.status_comment === "active"
                            ? "Deactivate this comment?"
                            : "Activate this comment?"}
                    </p>
                    <button
                        className="save-btn"
                        onClick={async () => {
                            try {
                                const newStatus =
                                    comment.status_comment === "active" ? "inactive" : "active";
                                await dispatch(
                                    updateCommentStatus({ id: comment.id, status_comment: newStatus, postId })
                                ).unwrap();
                                setIsStatusOpen(false);
                            } catch (err) {
                                console.error("Error updating comment status:", err);
                            }
                        }}
                    >
                        Confirm
                    </button>
                </Modal>
            )}

            {isReportOpen && (
                <Modal title="Report Comment" onClose={() => setIsReportOpen(false)}>
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            if (!requireAuth()) return;
                            const reason = e.target.reason.value.trim();
                            if (!reason) return;
                            try {
                                await dispatch(reportComment({ id: comment.id, reason, postId })).unwrap();
                                setIsReportOpen(false);
                            } catch (err) {
                                console.error("Error reporting comment:", err);
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
