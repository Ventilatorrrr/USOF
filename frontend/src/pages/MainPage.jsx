/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchCurrentUser } from "../redux/slices/authSlice";
import { fetchPosts, updateFavoriteLocal } from "../redux/slices/postSlice";
import { updatePost, deletePost, reportPost } from "../redux/slices/postSlice";

import Pagination from "../components/Pagination";
import LeftSidebar from "../components/LeftSidebar";
import CenterSidebar from "../components/CenterSidebar";
import RightSidebar from "../components/RightSidebar";
import RightSidebarAdmin from "../components/RightSidebarAdmin";
import "./MainPage.css";

const API_URL = process.env.REACT_APP_API_URL;

export default function MainPage({ onFinishTransition }) {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const [currentPage, setCurrentPage] = useState(1);
    const posts = useSelector((state) => state.posts.list);
    const totalPages = useSelector((state) => state.posts.totalPages);

    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [sortBy, setSortBy] = useState("likes");
    const [filters, setFilters] = useState({ status: "", startDate: "", endDate: "" });
    const [initialized, setInitialized] = useState(false);
    const [isLoadingPosts, setIsLoadingPosts] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken && !user && storedToken.split(".").length === 3) {
            dispatch(fetchCurrentUser());
        }
    }, [user, dispatch]);

    useEffect(() => {
        fetch(`${API_URL}/categories`)
            .then((res) => res.json())
            .then((data) => setCategories(data))
            .catch((err) => console.error("Error loading categories:", err));
    }, []);

    useEffect(() => {
        const limit = 5;
        setIsLoadingPosts(true);

        dispatch(fetchPosts({
            page: currentPage,
            limit,
            sort: sortBy,
            categoryId: selectedCategories.length ? selectedCategories.join(",") : undefined,
            fromDate: filters.startDate || undefined,
            toDate: filters.endDate || undefined,
        }))
            .finally(() => {
                setIsLoadingPosts(false);
                if (!initialized) {
                    setInitialized(true);
                    onFinishTransition?.();
                }
            });
    }, [dispatch, currentPage, sortBy, filters, selectedCategories, initialized, onFinishTransition]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const handleCategoryToggle = (categoryId) => {
        setSelectedCategories((prev) =>
            prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
        );
        setCurrentPage(1);
    };

    const handleEdit = (post) => {
        console.log("Editing post:", post);
    };

    const handleDelete = (postId) => {
        if (!window.confirm("Delete this post?")) return;
        dispatch(deletePost(postId));
    };

    const handleReport = (postId) => {
        const reason = prompt("Why are you reporting this post?");
        if (!reason?.trim()) return;
        dispatch(reportPost({ postId, reason }));
    };

    const handleUpdateStatus = (postId, status_post) => {
        dispatch(updatePost({ postId, updates: { status_post } }));
    };

    return (
        <div className="page-container">
            <div className="page-layout">

                <div className="left-column">
                    <LeftSidebar
                        categories={categories}
                        selectedCategories={selectedCategories}
                        handleCategoryToggle={handleCategoryToggle}
                        filters={filters}
                        handleFilterChange={handleFilterChange}
                        sortBy={sortBy}
                        setSortBy={(val) => { setSortBy(val); setCurrentPage(1); }}
                    />
                </div>

                <div className="center-column">
                    {isLoadingPosts ? (
                        <div className="loading-placeholder">Loading...</div>
                    ) : (
                        posts.length > 0 ? (
                            <div className="fade-in">
                                <CenterSidebar
                                    posts={posts}
                                    onToggleFavorite={(postId, value) => {
                                        dispatch(updateFavoriteLocal({ postId, value }));
                                    }}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onReport={handleReport}
                                    onUpdateStatus={handleUpdateStatus}
                                />
                            </div>
                        ) : (
                            <p className="no-posts fade-in">No posts found.</p>
                        )
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

            {initialized && (
                <div className="pagination-wrapper-full">
                    <Pagination currentPage={currentPage} totalPages={totalPages || 1} onPageChange={setCurrentPage} />
                </div>
            )}
        </div>
    );
}
