import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserById } from "../redux/slices/authSlice";
import { fetchPosts, updateFavoriteLocal } from "../redux/slices/postSlice";

import UserProfileSidebar from "../components/UserProfileSidebar";
import UserPostsList from "../components/UserPostsList";
import LeftSidebar from "../components/LeftSidebar";
import Pagination from "../components/Pagination";

import "./MainPage.css";

const API_URL = process.env.REACT_APP_API_URL;

export default function UserProfilePage() {
    const { id } = useParams();
    const dispatch = useDispatch();

    const { viewedUser, status: userStatus, user: currentUser } = useSelector((s) => s.auth);
    const { list: posts, totalPages, status: postsStatus } = useSelector((s) => s.posts);
    const [displayedPosts, setDisplayedPosts] = useState([]);

    const isOwnProfile = Number(currentUser?.id) === Number(id);
    const displayedUser = isOwnProfile ? currentUser : viewedUser;

    const [currentPage, setCurrentPage] = useState(1);
    const [isFading, setIsFading] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [sortBy, setSortBy] = useState("likes");
    const [filters, setFilters] = useState({ startDate: "", endDate: "" });

    useEffect(() => {
        if (!id) return;

        setIsTransitioning(true);

        const loadUserData = async () => {
            try {
                await dispatch(fetchUserById(id)).unwrap();
                await dispatch(fetchPosts({
                    authorId: id,
                    page: 1,
                    limit: 5,
                    sort: sortBy,
                }));
            } catch (err) {
                console.error("Error loading user data:", err);
            } finally {
                setTimeout(() => setIsTransitioning(false), 250);
            }
        };

        loadUserData();
    }, [id, dispatch, sortBy]);

    useEffect(() => {
        fetch(`${API_URL}/categories`)
            .then((res) => res.json())
            .then((data) => setCategories(data))
            .catch((err) => console.error("Error loading categories:", err));
    }, []);

    useEffect(() => {
        if (!id) return;
        dispatch(
            fetchPosts({
                authorId: id,
                page: currentPage,
                limit: 5,
                sort: sortBy,
                categoryId: selectedCategories.length
                    ? selectedCategories.join(",")
                    : undefined,
                fromDate: filters.startDate || undefined,
                toDate: filters.endDate || undefined,
            })
        );
    }, [dispatch, id, currentPage, sortBy, filters, selectedCategories]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const handleCategoryToggle = (categoryId) => {
        setSelectedCategories((prev) =>
            prev.includes(categoryId)
                ? prev.filter((id) => id !== categoryId)
                : [...prev, categoryId]
        );
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        setIsFading(true);
        setTimeout(() => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }, 200);
        setTimeout(() => setIsFading(false), 600);
    };

    useEffect(() => {
        if (postsStatus === "succeeded") {
            setDisplayedPosts(posts);
        }
    }, [postsStatus, posts]);

    if (!displayedUser && userStatus === "loading") {
        return (
            <div className="page-container fade-in">
                <div className="loading-overlay">Loading...</div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-layout">

                <div className="left-column">
                    <UserProfileSidebar user={displayedUser} />
                </div>

                <div className="center-column">
                    {postsStatus === "loading" && displayedPosts.length > 0 ? (

                        <div className="posts-loading">
                            <UserPostsList
                                posts={displayedPosts}
                                userId={Number(id)}
                                readOnly
                            />
                            <div className="loading-overlay">Loading...</div>
                        </div>
                    ) : postsStatus === "loading" && displayedPosts.length === 0 ? (
                        <div className="no-posts-message">Loading...</div>
                    ) : displayedPosts.length === 0 ? (
                        <div className="no-posts-message">No posts found.</div>
                    ) : (
                        <UserPostsList
                            posts={displayedPosts}
                            userId={Number(id)}
                            readOnly
                            onToggleFavorite={(postId, value) =>
                                dispatch(updateFavoriteLocal({ postId, value }))
                            }
                        />
                    )}
                </div>

                <div className="right-column">
                    <LeftSidebar
                        categories={categories}
                        selectedCategories={selectedCategories}
                        handleCategoryToggle={handleCategoryToggle}
                        filters={filters}
                        handleFilterChange={handleFilterChange}
                        sortBy={sortBy}
                        setSortBy={(val) => {
                            setSortBy(val);
                            setCurrentPage(1);
                        }}
                        fromProfile
                        hideBreadcrumbs
                    />
                </div>
            </div>

            <div className="pagination-wrapper-full">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            </div>
        </div>
    );
}

