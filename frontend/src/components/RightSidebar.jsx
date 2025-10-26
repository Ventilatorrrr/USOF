import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import "./RightSidebar.css";
import LogoutButton from "./LogoutButton";

export default function RightSidebar({ onChangeView }) {
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

    return (
        <div className="right-sidebar">
            <div className="sidebar-content">
                <h3>Important</h3>

                {/* My posts */}
                <div className="sidebar-item post-item" onClick={() => goTo("my")}>
                    <span>My posts</span>
                    <button className="add-post-btn" onClick={handleCreatePost}>
                        +
                    </button>
                </div>

                {/* Liked posts */}
                <div className="sidebar-item" onClick={() => goTo("liked")}>
                    Liked posts
                </div>

                {/* Favorite posts */}
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
