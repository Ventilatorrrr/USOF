import React, { useMemo, useState, useEffect, useRef } from "react";
import "./Header.css";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import appLogo from "../assets/images/logo/app-logo.png";
import searchIcon from "../assets/images/logo/search-icon.png";
import avatarDefault from "../assets/images/logo/avatar-default.png";

export default function Header() {
    const navigate = useNavigate();
    const { user, token } = useSelector((state) => state.auth);

    const rawAvatar = user?.avatar_url || user?.profile_picture || user?.avatar || "";
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const base = API_URL.replace(/\/+$/, "").replace(/\/api$/, "");

    const normalizedSrc = useMemo(() => {
        if (!rawAvatar) return avatarDefault;
        if (rawAvatar.startsWith("http")) return rawAvatar;
        return rawAvatar.startsWith("/") ? `${base}${rawAvatar}` : `${base}/${rawAvatar}`;
    }, [rawAvatar, base]);

    const avatarUrl = useMemo(() => {
        if (normalizedSrc === avatarDefault) return normalizedSrc;
        const v = user?.updated_at ? new Date(user.updated_at).getTime() : 0;
        if (!v) return normalizedSrc;
        try {
            const u = new URL(normalizedSrc, window.location.origin);
            u.searchParams.set("v", String(v));
            return u.toString();
        } catch {
            const glue = normalizedSrc.includes("?") ? "&" : "?";
            return `${normalizedSrc}${glue}v=${v}`;
        }
    }, [normalizedSrc, user?.updated_at]);

    const [imgFailed, setImgFailed] = useState(false);
    const finalSrc = imgFailed ? avatarDefault : avatarUrl;

    const handleAvatarClick = () => {
        if (token && user) navigate("/profile");
        else navigate("/register");
    };

    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const timeoutRef = useRef(null);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        const controller = new AbortController();
        const signal = controller.signal;
        clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const headers = { "Content-Type": "application/json" };
                if (token) headers["Authorization"] = `Bearer ${token}`;

                const res = await fetch(`${API_URL}/posts/search?q=${encodeURIComponent(query)}`, { headers, signal });
                const data = await res.json();
                const normalized = Array.isArray(data) ? data : (data ? [data] : []);
                setResults(normalized.slice(0, 6));
                setShowDropdown(normalized.length > 0);
            } catch (err) {
                if (err.name !== "AbortError") console.error("Search error:", err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => {
            clearTimeout(timeoutRef.current);
            controller.abort();
        };
    }, [query]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (inputRef.current && !inputRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const handleSelectResult = (postId) => {
        setShowDropdown(false);
        setQuery("");
        navigate(`/post/${postId}`);
    };

    return (
        <header className="header">
            <div className="header-left" onClick={() => navigate("/")}>
                <img src={appLogo} alt="Logo" className="logo" />
                <span className="site-name">usof</span>
            </div>

            <div className="header-center" ref={inputRef}>
                <div className="search-container">
                    <img src={searchIcon} alt="Search" className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="search-input"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => query.trim() && setShowDropdown(true)}
                    />
                    {loading && <div className="loader"></div>}
                </div>

                {showDropdown && results.length > 0 && (
                    <div className="search-dropdown">
                        {results.map((post) => (
                            <div
                                key={post.id}
                                className="search-item"
                                onClick={() => handleSelectResult(post.id)}
                            >
                                <span className="search-title">{post.title}</span>
                                <span className="search-author">by {post.author_login || "Unknown"}</span>
                            </div>
                        ))}
                    </div>
                )}

                {showDropdown && !loading && results.length === 0 && (
                    <div className="search-dropdown empty">No results</div>
                )}

                <Link to="/about" className="about-link">ABOUT</Link>
            </div>

            <div className="header-right">
                {token && user ? (
                    <div className="user-info">
                        <span className="username">{user.username || user.login || "User"}</span>
                        <span className="role">{user.role || "User"}</span>
                    </div>
                ) : (
                    <div className="user-info">
                        <span className="username">Guest</span>
                        <span className="role">visitor</span>
                    </div>
                )}

                <img
                    src={finalSrc}
                    alt={(user?.username || user?.login || "User") + " avatar"}
                    className="avatar"
                    onClick={handleAvatarClick}
                    onError={() => setImgFailed(true)}
                />
            </div>
        </header>
    );
}
