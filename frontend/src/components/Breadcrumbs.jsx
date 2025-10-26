import { useLocation, Link, useParams } from "react-router-dom";
import React, { useMemo } from "react";
import "./Breadcrumbs.css";

export default function Breadcrumbs({ viewMode, postTitle, user }) {
    const location = useLocation();
    const { id } = useParams();

    const fromProfile = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get("from") === "profile";
    }, [location.search]);

    const path = location.pathname;

    const labels = {
        my: "My Posts",
        liked: "Liked Posts",
        favorite: "Favorite Posts",
        profile: "Profile",
        post: postTitle ? `Post: ${postTitle}` : "Post",
    };

    const isProfile = path.startsWith("/profile");
    const isPost = path.startsWith("/post/");
    const isUserProfile = path.startsWith("/user/");

    if (isProfile && !isPost) {
        const currentLabel = labels[viewMode] || "My Posts";
        return (
            <nav className="breadcrumbs">
                <Link to="/" className="crumb-link">Home</Link>
                <span className="crumb-separator">/</span>
                <Link to="/profile" className="crumb-link">Profile</Link>
                {viewMode && (
                    <>
                        <span className="crumb-separator">/</span>
                        <span className="crumb-current">{currentLabel}</span>
                    </>
                )}
            </nav>
        );
    }

    if (isUserProfile) {
        const username =
            user?.login ||
            user?.username ||
            user?.full_name ||
            null;

        return (
            <nav className="breadcrumbs">
                <Link to="/" className="crumb-link">Home</Link>
                <span className="crumb-separator">/</span>
                {username ? (
                    <span className="crumb-current">{username}</span>
                ) : (
                    <span className="crumb-current">User #{id}</span>
                )}
            </nav>
        );
    }

    if (isPost) {
        return (
            <nav className="breadcrumbs">
                <Link to="/" className="crumb-link">Home</Link>
                {fromProfile ? (
                    <>
                        <span className="crumb-separator">/</span>
                        <Link to="/profile" className="crumb-link">Profile</Link>
                        <span className="crumb-separator">/</span>
                        <span className="crumb-current">{labels.post}</span>
                    </>
                ) : (
                    <>
                        <span className="crumb-separator">/</span>
                        <span className="crumb-current">{labels.post}</span>
                    </>
                )}
            </nav>
        );
    }

    if (path.startsWith("/admin")) {
        let currentLabel = "";

        if (path.includes("/users")) currentLabel = "Profiles";
        else if (path.includes("/categories")) currentLabel = "Categories";
        else if (path.includes("/reports")) currentLabel = "Reports";
        else currentLabel = "Admin Section";

        return (
            <nav className="breadcrumbs">
                <Link to="/" className="crumb-link">Home</Link>
                <span className="crumb-separator">/</span>
                <Link to="/profile" className="crumb-link">Profile</Link>
                <span className="crumb-separator">/</span>
                <span className="crumb-current">{currentLabel}</span>
            </nav>
        );
    }

    return (
        <nav className="breadcrumbs">
            <span className="crumb-current">Home</span>
        </nav>
    );
}
