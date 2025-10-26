import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createPost } from "../redux/slices/postSlice";
import { useNavigate } from "react-router-dom";
import ProfileSidebar from "../components/ProfileSidebar";
import RightSidebar from "../components/RightSidebar";
import Pagination from "../components/Pagination";
import "./MainPage.css";
import "./CreatePostPage.css";
import "../components/LeftSidebar.css";
import RightSidebarAdmin from "../components/RightSidebarAdmin";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function CreatePostPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const [menuOpen, setMenuOpen] = useState(false);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [allCategories, setAllCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_URL}/categories`);
                const data = await res.json();
                setAllCategories(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Error loading categories:", err);
            }
        };
        fetchCategories();
    }, []);

    const handleCategoryToggle = (id) => {
        setSelectedCategories((prev) =>
            prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            setError("Title and content are required");
            return;
        }
        setLoading(true);
        try {
            await dispatch(
                createPost({
                    title,
                    content,
                    categories: selectedCategories,
                })
            ).unwrap();

            navigate("/profile");
        } catch (err) {
            console.error("Create post error:", err);
            setError("Failed to create post");
        } finally {
            setLoading(false);
        }
    };

    const handleSidebarNav = (mode) => {
        if (!user) return;

        navigate("/profile", { state: { viewMode: mode } });
        setMenuOpen(false);
    };


    return (
        <div className="page-container">
            <div className="page-layout">

                <div className="left-column">
                    <ProfileSidebar user={user} />
                </div>

                <div className="center-column">

                    <form className="create-post-form" onSubmit={handleSubmit}>
                        <h2 className="page-title">Create New Post</h2>
                        <label>
                            Title:
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter post title"
                            />
                        </label>

                        <label>
                            Content:
                            <textarea
                                rows="8"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Write your post content..."
                            ></textarea>
                        </label>

                        <div className="category-section">
                            <h3>Choose categories</h3>
                            <div className="category-boxes">
                                {allCategories.length > 0 ? (
                                    allCategories.map((cat) => (
                                        <div
                                            key={cat.id}
                                            className={`category-box ${
                                                selectedCategories.includes(cat.id)
                                                    ? "active"
                                                    : ""
                                            }`}
                                            onClick={() => handleCategoryToggle(cat.id)}
                                        >
                                            {cat.title}
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-categories">No categories</p>
                                )}
                            </div>
                        </div>

                        {error && <p className="error-text">{error}</p>}

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? "Publishing..." : "Publish Post"}
                        </button>
                    </form>
                </div>

                <div className="right-column">
                    {user?.role === "admin" ? (
                        <RightSidebarAdmin onChangeView={handleSidebarNav} />
                    ) : (
                        <RightSidebar onChangeView={handleSidebarNav} />
                    )}
                </div>
            </div>

            <div className="pagination-wrapper-full">
                <Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />
            </div>
        </div>
    );
}

