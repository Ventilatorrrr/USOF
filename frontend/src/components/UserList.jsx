import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { endpoints } from "../api/endpoints";
import defaultAvatar from "../assets/images/logo/avatar-default.png";
import "./UserList.css";

export default function UserList({ page = 1, onTotalPagesChange }) {
    const [users, setUsers] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); // 🔹 ДОДАНО

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const params = { page, limit: 10 };
                const { data } = await api.get(endpoints.users.all(), { params });
                setUsers(data.users || data || []);
                setTotalPages(data.totalPages || 1);
                onTotalPagesChange && onTotalPagesChange(data.totalPages || 1);
            } catch (err) {
                console.error("Error loading users:", err);
                setUsers([]);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [page]);

    const getAvatar = (avatar) => {
        const base = process.env.REACT_APP_API_URL?.replace(/\/+$/, "").replace(/\/api$/, "") || "";
        if (!avatar) return defaultAvatar;
        if (avatar.startsWith("http")) return avatar;
        if (avatar.startsWith("/")) return `${base}${avatar}`;
        return `${base}/${avatar}`;
    };

    const handleUserClick = (id) => {
        navigate(`/user/${id}`);
    };

    if (loading) return <div className="loading-placeholder">Loading users...</div>;

    return (
        <div className="user-list-wrapper">
            {users.length === 0 ? (
                <p>No users found.</p>
            ) : (
                users.map((u) => (
                    <div
                        className="user-card"
                        key={u.id}
                        onClick={() => handleUserClick(u.id)}
                        style={{ cursor: "pointer" }}
                    >
                        <div className="user-avatar-wrapper">
                            <img src={getAvatar(u.profile_picture)} alt={u.login} className="user-avatar" />
                        </div>

                        <div className="user-info">
                            <div className="user-header">
                                <span className="user-login">{u.login}</span>
                                <span
                                    className={`status-symbol ${u.is_online ? "active" : "inactive"}`}
                                    title={u.is_online ? "Online" : "Offline"}
                                >
                                    ⚬
                                </span>
                                <span className="user-created">
                                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                                </span>
                            </div>
                            <div className="user-role">{u.role}</div>
                        </div>

                        <div className="user-stats">
                            <div className="user-rating">Rating: {u.rating ?? 0}</div>
                            <div className="user-posts">Posts: {u.posts_count ?? 0}</div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

