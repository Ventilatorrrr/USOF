import React, { useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { deleteUser } from "../redux/slices/userSlice";
import "./ProfileSidebar.css";
import defaultAvatar from "../assets/images/logo/avatar-default.png";
import Breadcrumbs from "./Breadcrumbs";
import Modal from "./Modal";
import AvatarUploader from "./AvatarUploader";
import EditLoginForm from "../utils/EditLoginForm";
import githubIcon from "../assets/images/social-networks/github-icon.png";
import linkedinIcon from "../assets/images/social-networks/linkedin-icon.png";
import telegramIcon from "../assets/images/social-networks/telegram-icon.png";
import instagramIcon from "../assets/images/social-networks/instagram-icon.png";

export default function UserProfileSidebar({ user }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [imgFailed, setImgFailed] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const { user: currentUser } = useSelector((s) => s.auth);
    const isAdmin = currentUser?.role === "admin";
    const isSelf = currentUser?.id === user?.id;
    const canEdit = isSelf || isAdmin;

    const rawAvatar = user?.avatar_url || user?.profile_picture || user?.avatar || "";
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const base = API_URL.replace(/\/+$/, "").replace(/\/api$/, "");
    const avatarUrl = useMemo(() => {
        if (!rawAvatar) return defaultAvatar;
        if (rawAvatar.startsWith("http")) return rawAvatar;
        return rawAvatar.startsWith("/") ? `${base}${rawAvatar}` : `${base}/${rawAvatar}`;
    }, [rawAvatar, base]);

    const finalSrc = imgFailed ? defaultAvatar : avatarUrl;
    if (!user) {
        return (
            <div className="profile-sidebar readonly">
                <Breadcrumbs user={user} />
                <div className="profile-info">
                    <img src={finalSrc} alt="loading" className="profile-avatar" />
                    <p>Loading user data...</p>
                </div>
            </div>
        );
    }

    const login =
        user?.login ||
        user?.username ||
        user?.full_name ||
        (user?.email ? user.email.split("@")[0] : "user");

    const rating = Number.isFinite(user?.rating) ? user.rating : Number(user?.rating) || 0;
    const role = user?.role || "user";
    const status = user?.status_users || "offline";
    const publishDate = user?.publish_date || user?.created_at;

    const social = user?.social_links || {
        github: user?.github,
        linkedin: user?.linkedin,
        telegram: user?.telegram,
        instagram: user?.instagram,
    };
    const hasSocials = social && Object.values(social).some((v) => v && v.trim() !== "");

    const handleDeleteUser = async () => {
        try {
            await dispatch(deleteUser(user.id)).unwrap();
            navigate("/");
        } catch (err) {
            console.error("deleteUser error:", err);
        }
    };

    return (
        <div className="profile-sidebar readonly">
            <Breadcrumbs user={user} />

            <div className="profile-info">
                <img
                    src={finalSrc}
                    alt={login}
                    className="profile-avatar"
                    onError={() => setImgFailed(true)}
                />
                <h3 className="profile-username">
                    {login}
                    <span className="profile-rating">{rating}</span>
                </h3>

                <div className="profile-role-status">
                    <div className="profile-role">{role} |</div>
                    <div className={`profile-status ${status}`}>{status}</div>
                </div>

                <p className="profile-email">{user?.email || "-"}</p>

                {hasSocials && (
                    <div className="profile-socials">
                        {social.github && (
                            <a href={social.github} target="_blank" rel="noopener noreferrer">
                                <img src={githubIcon} alt="GitHub" />
                            </a>
                        )}
                        {social.linkedin && (
                            <a href={social.linkedin} target="_blank" rel="noopener noreferrer">
                                <img src={linkedinIcon} alt="LinkedIn" />
                            </a>
                        )}
                        {social.telegram && (
                            <a href={social.telegram} target="_blank" rel="noopener noreferrer">
                                <img src={telegramIcon} alt="Telegram" />
                            </a>
                        )}
                        {social.instagram && (
                            <a href={social.instagram} target="_blank" rel="noopener noreferrer">
                                <img src={instagramIcon} alt="Instagram" />
                            </a>
                        )}
                    </div>
                )}

                {canEdit && (
                    <div className="profile-settings-user">
                        <h4>Profile settings</h4>
                        <ul>
                            <li>
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowLoginModal(true);
                                    }}
                                >
                                    Edit login
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowAvatarModal(true);
                                    }}
                                >
                                    Edit avatar
                                </a>
                            </li>
                            {isAdmin && !isSelf && (
                                <li>
                                    <a
                                        href="#"
                                        className="danger-link"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setShowDeleteModal(true);
                                        }}
                                    >
                                        Delete user
                                    </a>
                                </li>
                            )}
                        </ul>
                    </div>
                )}
            </div>

            <div className="profile-created">
                <small>
                    Created: {publishDate ? new Date(publishDate).toLocaleDateString() : "-"}
                </small>
            </div>

            {showAvatarModal && (
                <Modal onClose={() => setShowAvatarModal(false)} title="Change avatar">
                    <AvatarUploader
                        currentAvatar={avatarUrl}
                        userId={isAdmin && !isSelf ? user.id : undefined}
                        onDone={() => setShowAvatarModal(false)}
                    />
                </Modal>
            )}

            {showLoginModal && (
                <Modal onClose={() => setShowLoginModal(false)} title="Change login">
                    <EditLoginForm
                        userId={isAdmin && !isSelf ? user.id : undefined}
                        onClose={() => setShowLoginModal(false)}
                    />
                </Modal>
            )}

            {showDeleteModal && (
                <Modal onClose={() => setShowDeleteModal(false)} title="Confirm Deletion">
                    <p>Are you sure you want to permanently delete this user?</p>
                    <div className="form-buttons" style={{ justifyContent: "center" }}>
                        <button
                            className="cancel-btn"
                            onClick={() => setShowDeleteModal(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className="delete-btn"
                            onClick={async () => {
                                await handleDeleteUser();
                                setShowDeleteModal(false);
                            }}
                        >
                            Delete
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
