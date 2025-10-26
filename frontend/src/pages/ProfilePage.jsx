import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchCurrentUser } from "../redux/slices/authSlice";
import { fetchPosts, updateFavoriteLocal } from "../redux/slices/postSlice";
import { useLocation } from "react-router-dom";

import Pagination from "../components/Pagination";
import ProfileSidebar from "../components/ProfileSidebar";
import UserPostsList from "../components/UserPostsList";
import RightSidebar from "../components/RightSidebar";
import RightSidebarAdmin from "../components/RightSidebarAdmin";
import "./MainPage.css";

export default function ProfilePage() {
    const dispatch = useDispatch();

    const { user } = useSelector((state) => state.auth);
    const { list: posts, totalPages, status } = useSelector((state) => state.posts);

    const [viewMode, setViewMode] = useState("my");
    const [currentPage, setCurrentPage] = useState(1);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token && !user && token.split(".").length === 3) {
            dispatch(fetchCurrentUser());
        }
    }, [user, dispatch]);

    useEffect(() => {
        if (!user?.id) return;
        const filters = { page: currentPage, limit: 5 };
        if (viewMode === "my") filters.authorId = user.id;
        else if (viewMode === "liked") filters.likedBy = user.id;
        else if (viewMode === "favorite") filters.favoritedBy = user.id;
        dispatch(fetchPosts(filters));
    }, [dispatch, user?.id, viewMode, currentPage]);

    useEffect(() => {
        if (status === "loading") {
            setIsTransitioning(true);

            const timer = setTimeout(() => {
                setIsTransitioning(false);
            }, 400);

            return () => clearTimeout(timer);
        }
    }, [status]);

    useEffect(() => {
        if (location.state?.viewMode && location.state.viewMode !== viewMode) {
            setViewMode(location.state.viewMode);
        }
    }, [location.state]);

    if (!user) return <div className="loading-placeholder">Loading user...</div>;

    return (
        <div className="page-container">
            <div className="page-layout">
                <div className="left-column">
                    <ProfileSidebar user={user} onChangeView={setViewMode} active={viewMode} />
                </div>

                <div
                    key={viewMode}
                    className="center-column fade-in"
                >
                    <UserPostsList
                        posts={posts}
                        userId={user?.id}
                        viewMode={viewMode}
                        page={currentPage}
                        onToggleFavorite={(postId, value) => {
                            dispatch(updateFavoriteLocal({ postId, value }));
                        }}
                    />
                </div>

                <div className="right-column">
                    {user?.role === "admin" ? (
                        <RightSidebarAdmin onChangeView={setViewMode} />
                    ) : (
                        <RightSidebar onChangeView={setViewMode} />
                    )}
                </div>
            </div>

            <div className="pagination-wrapper-full">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                />
            </div>
        </div>
    );
}
