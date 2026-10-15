/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps */
import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchPostById } from "../redux/slices/postSlice";
import { fetchCommentsByPost } from "../redux/slices/commentSlice";
import LeftSidebar from "../components/LeftSidebar";
import PostCard from "../components/PostCard";
import CommentsSection from "../components/CommentsSection";
import RightSidebar from "../components/RightSidebar";
import RightSidebarAdmin from "../components/RightSidebarAdmin";
import "./PostPage.css";

export default function PostPage({ onFinishTransition }) {
    const { id } = useParams();
    const dispatch = useDispatch();
    const { user, token } = useSelector((state) => state.auth);
    const post = useSelector((state) => state.posts.selected);
    const comments = useSelector((s) => s.comments.byPost[Number(id)] || []);
    const totals = useSelector((s) => s.comments.totals);
    const [error, setError] = useState("");
    const [initialized, setInitialized] = useState(false);
    const categories = Array.isArray(post?.categories) ? post.categories : [];
    const location = useLocation();
    const fromProfile = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get("from") === "profile";
    }, [location.search]);

    useEffect(() => {
        const timer = setTimeout(() => setInitialized(true), 150);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!initialized) return;
        dispatch(fetchPostById(id))
            .unwrap()
            .then((fetchedPost) => {
                if (fetchedPost?.id) {
                    dispatch(fetchCommentsByPost(fetchedPost.id));
                }
            })
            .catch((err) => {
                console.error("Error loading post:", err);
                if (err.response?.status === 401)
                    setError("Please log in to view this post");
                else setError("Failed to load post data");
            })
            .finally(() => {
                onFinishTransition?.();
            });
    }, [id, initialized, dispatch, onFinishTransition]);

    useEffect(() => {
        if (!totals?.[id]) return;
        dispatch(fetchCommentsByPost(id));
    }, [totals?.[id], id, dispatch]);

    useEffect(() => {
        const hash = window.location.hash;
        if (hash && hash.startsWith("#comment-")) {

            setTimeout(() => {
                const element = document.querySelector(hash);
                if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "center" });
                    element.classList.add("highlighted-comment");
                    setTimeout(() => element.classList.remove("highlighted-comment"), 2000);
                }
            }, 600);
        }
    }, [comments]);

    return (
        <div className="page-container">
            <div className="page-layout">
                <div className="left-column">
                    <LeftSidebar
                        categories={categories}
                        selectedCategories={[]}
                        handleCategoryToggle={() => {}}
                        filters={{ startDate: "", endDate: "" }}
                        handleFilterChange={() => {}}
                        sortBy="date"
                        setSortBy={() => {}}
                        fromProfile={fromProfile}
                    />
                </div>

                <div className="center-column">
                    {!initialized ? (
                        <div className="loading-placeholder">Loading...</div>
                    ) : error ? (
                        <p className="error-text">{error}</p>
                    ) : post ? (
                        <div className="fade-in">
                            <PostCard post={post} className="full" />
                            <CommentsSection comments={comments} postId={post?.id} />
                        </div>
                    ) : (
                        <div className="loading-placeholder">Loading post...</div>
                    )}
                </div>

                <div className="right-column">
                    {user?.role === "admin" ? (
                        <RightSidebarAdmin />
                    ) : (
                        <RightSidebar />
                    )}
                </div>
            </div>
        </div>
    );
}
