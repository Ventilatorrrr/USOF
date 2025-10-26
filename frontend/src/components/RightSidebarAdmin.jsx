import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import "./RightSidebar.css";
import LogoutButton from "./LogoutButton";

export default function RightSidebar({ onChangeView, onCreateUser, onCreateCategory }) {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const requireAuth = (callback) => {
        if (!user) {
            navigate("/register", { state: { fromSidebar: true } });
            return false;
        }
        callback?.();
        return true;
    };

    const goTo = (mode) => {
        requireAuth(() => {
            if (onChangeView) {
                onChangeView(mode);
            } else {
                navigate("/profile", { state: { viewMode: mode } });
            }
        });
    };

    const handleCreatePost = (e) => {
        e.stopPropagation();
        requireAuth(() => navigate("/create-post"));
    };

    const goToProfiles = () => requireAuth(() => navigate("/admin/users"));
    const goToCategories = () => requireAuth(() => navigate("/admin/categories"));
    const goToReports = () => requireAuth(() => navigate("/admin/reports"));

    return (
        <div className="right-sidebar">
            <div className="sidebar-content">

                {user?.role === "admin" && (
                    <div className="admin-section">
                        <h3>Admin Panel</h3>

                        <div className="sidebar-item post-item" onClick={goToProfiles}>
                            <span>Profiles</span>
                            <button
                                className="add-post-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCreateUser?.();
                                }}
                            >
                                +
                            </button>
                        </div>

                        <div className="sidebar-item post-item" onClick={goToCategories}>
                            <span>Categories</span>
                            <button
                                className="add-post-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCreateCategory?.();
                                }}
                            >
                                +
                            </button>
                        </div>

                        <div className="sidebar-item" onClick={goToReports}>
                            Reports
                        </div>

                        <hr className="sidebar-separator" />
                    </div>
                )}

                <h3>Important</h3>

                <div className="sidebar-item post-item" onClick={() => goTo("my")}>
                    <span>My posts</span>
                    <button className="add-post-btn" onClick={handleCreatePost}>
                        +
                    </button>
                </div>

                <div className="sidebar-item" onClick={() => goTo("liked")}>
                    Liked posts
                </div>

                <div className="sidebar-item" onClick={() => goTo("favorite")}>
                    Favorite posts
                </div>
            </div>

            <div className="sidebar-footer">
                {user && <LogoutButton redirectTo="/" />}
            </div>
        </div>
    );
}
