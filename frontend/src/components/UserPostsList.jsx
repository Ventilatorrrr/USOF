import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { endpoints } from "../api/endpoints";
import PostCard from "./PostCard";
import "./UserPostsList.css";

export default function UserPostsList({
                                          userId,
                                          viewMode = "my",
                                          posts: propPosts = [],
                                          page: externalPage = 1,
                                          onTotalPagesChange,
                                          onEdit,
                                          onDelete,
                                          onReport,
                                          onUpdateStatus,
                                      }) {
    const navigate = useNavigate();
    const [posts, setPosts] = useState(propPosts);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (propPosts.length > 0) {
            setPosts(propPosts);
            return;
        }

        if (!userId) return;
        setLoading(true);

        const fetchData = async () => {
            try {
                const params = { page: externalPage, limit: 5 };
                if (viewMode === "liked") params.liked_by = userId;
                else if (viewMode === "favorite") params.favorited_by = userId;
                else params.author_id = userId;

                const { data } = await api.get(endpoints.posts.all(), { params });
                setPosts(data.posts || []);
                setTotalPages(data.totalPages || 1);
                onTotalPagesChange && onTotalPagesChange(data.totalPages || 1);
            } catch (err) {
                console.error("Error loading posts:", err);
                setPosts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId, viewMode, externalPage, propPosts]);

    const handlePostClick = (post, e) => {
        if (e.target.closest(".icon-item")) return;
        navigate(`/post/${post.id}`, { state: { post } });
    };

    return (
        <div className="user-posts-list fade-in">
            {loading ? (
                <div className="loading-placeholder">Loading posts...</div>
            ) : posts.length > 0 ? (
                posts.map((post) => (
                    <div
                        key={post.id}
                        className="user-post-card"
                        onClick={(e) => handlePostClick(post, e)}
                    >
                        <PostCard
                            post={post}
                            className="limited-height"
                            onCommentCreated={(id, newTotal) => {
                                setPosts(prev =>
                                    prev.map(p =>
                                        p.id === id ? { ...p, comments_count: newTotal } : p
                                    )
                                );
                            }}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onReport={onReport}
                            onUpdateStatus={onUpdateStatus}
                            showMenu={false}
                        />
                    </div>
                ))
            ) : (
                <p>No posts found.</p>
            )}
        </div>
    );
}

