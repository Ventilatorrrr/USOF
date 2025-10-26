import React, { useMemo, useState } from "react";
import "./ProfileSidebar.css";
import defaultAvatar from "../assets/images/logo/avatar-default.png";
import Breadcrumbs from "./Breadcrumbs";
import { useNavigate } from "react-router-dom";
import { logout } from "../redux/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import Modal from "./ModalAvatar";
import useLockBodyScroll from "../utils/useLockBodyScroll";
import EditLoginForm from "../utils/EditLoginForm";
import AvatarUploader from "./AvatarUploader";

import SocialLinksEditor from "./SocialLinksEditor";
import githubIcon from "../assets/images/social-networks/github-icon.png";
import linkedinIcon from "../assets/images/social-networks/linkedin-icon.png";
import telegramIcon from "../assets/images/social-networks/telegram-icon.png";
import instagramIcon from "../assets/images/social-networks/instagram-icon.png";

export default function ProfileSidebar({ active }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { status: authStatus, user } = useSelector((s) => s.auth);

    const [showEdit, setShowEdit] = useState(false);
    useLockBodyScroll(showEdit);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    useLockBodyScroll(showPasswordModal);

    const [showSocialModal, setShowSocialModal] = useState(false);
    useLockBodyScroll(showSocialModal);

    const [showLoginModal, setShowLoginModal] = useState(false);
    useLockBodyScroll(showLoginModal);

    const [socialLinks, setSocialLinks] = useState(user?.social_links || {});


    const login =
        user?.login ||
        user?.username ||
        user?.full_name ||
        (user?.email ? user.email.split("@")[0] : "user");

    const rating = user?.rating ?? 0;
    const role = user?.role || "user";
    const status = user?.status_users || "offline";
    const publishDate = user?.publish_date || user?.created_at;

    const rawAvatar = user?.avatar_url || user?.profile_picture || user?.avatar || "";
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const base = API_URL.replace(/\/+$/, "").replace(/\/api$/, "");

    const currentAvatar = useMemo(() => {
        if (!rawAvatar) return defaultAvatar;
        if (rawAvatar.startsWith("http")) return rawAvatar;
        return rawAvatar.startsWith("/") ? `${base}${rawAvatar}` : `${base}/${rawAvatar}`;
    }, [rawAvatar, base]);

    const avatarUrl = useMemo(() => {
        if (currentAvatar === defaultAvatar) return currentAvatar;
        const v = user?.updated_at ? new Date(user.updated_at).getTime() : 0;
        if (!v) return currentAvatar;

        try {
            const u = new URL(currentAvatar, window.location.origin);
            u.searchParams.set("v", String(v));
            return u.toString();
        } catch {
            const glue = currentAvatar.includes("?") ? "&" : "?";
            return `${currentAvatar}${glue}v=${v}`;
        }
    }, [currentAvatar, user?.updated_at]);

    const [imgFailed, setImgFailed] = useState(false);
    const finalSrc = imgFailed ? defaultAvatar : avatarUrl;

    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            await dispatch(logout()).unwrap();
        } finally {
            navigate("/");
        }
    };

    return (
        <div className="profile-sidebar">
            <Breadcrumbs viewMode={active} />

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

                <div className="profile-socials">
                    {socialLinks.github && (
                        <a href={socialLinks.github} target="_blank" rel="noopener noreferrer">
                            <img src={githubIcon} alt="GitHub" />
                        </a>
                    )}
                    {socialLinks.linkedin && (
                        <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                            <img src={linkedinIcon} alt="LinkedIn" />
                        </a>
                    )}
                    {socialLinks.telegram && (
                        <a href={socialLinks.telegram} target="_blank" rel="noopener noreferrer">
                            <img src={telegramIcon} alt="Telegram" />
                        </a>
                    )}
                    {socialLinks.instagram && (
                        <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                            <img src={instagramIcon} alt="Instagram" />
                        </a>
                    )}
                </div>

            </div>

            <div className="profile-settings">
                <h4>Profile settings</h4>
                <ul>
                    <li>
                        <a
                            href="/profile/socials"
                            onClick={(e) => {
                                e.preventDefault();
                                setShowSocialModal(true);
                            }}
                        >
                            Edit social links
                        </a>
                    </li>
                    <li>
                        <a
                            href="/profile/edit-login"
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
                            href="/profile/edit"
                            onClick={(e) => {
                                e.preventDefault();
                                setShowEdit(true);
                            }}
                        >
                            Edit avatar
                        </a>
                    </li>
                    <li>
                        <a href="/logout" onClick={handleLogout}>
                            {authStatus === "loading" ? "Logging out..." : "Logout"}
                        </a>
                    </li>
                </ul>
            </div>

            <div className="profile-created">
                <small>
                    Created: {publishDate ? new Date(publishDate).toLocaleDateString() : "-"}
                </small>
            </div>

            <Modal
                open={showEdit}
                onClose={() => setShowEdit(false)}
                title="Change avatar"
            >
                <AvatarUploader
                    currentAvatar={currentAvatar}
                    onDone={() => setShowEdit(false)}
                />
            </Modal>

            <Modal
                open={showSocialModal}
                onClose={() => setShowSocialModal(false)}
                title="Edit social links"
            >
                <SocialLinksEditor
                    currentLinks={socialLinks}
                    onSave={(updated) => setSocialLinks(updated)}
                    onClose={() => setShowSocialModal(false)}
                />
            </Modal>

            <Modal
                open={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                title="Change login"
            >
                <EditLoginForm onClose={() => setShowLoginModal(false)} />
            </Modal>

        </div>
    );
}
