// src/components/SocialLinksEditor.jsx
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { updateUserSocials } from "../redux/slices/authSlice";
import "./SocialLinksEditor.css";
import githubIcon from "../assets/images/social-networks/github-icon.png";
import linkedinIcon from "../assets/images/social-networks/linkedin-icon.png";
import telegramIcon from "../assets/images/social-networks/telegram-icon.png";
import instagramIcon from "../assets/images/social-networks/instagram-icon.png";

export default function SocialLinksEditor({ currentLinks = {}, onSave, onClose }) {
    const dispatch = useDispatch();

    const [links, setLinks] = useState({
        github: currentLinks.github || "",
        linkedin: currentLinks.linkedin || "",
        telegram: currentLinks.telegram || "",
        instagram: currentLinks.instagram || "",
    });

    const handleChange = (key, value) => {
        setLinks({ ...links, [key]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await dispatch(updateUserSocials(links));
        onSave(links);
        onClose();
    };

    return (
        <form className="social-editor" onSubmit={handleSubmit}>
            <div className="social-row">
                <img src={githubIcon} alt="GitHub" />
                <input
                    type="url"
                    placeholder="GitHub URL"
                    value={links.github}
                    onChange={(e) => handleChange("github", e.target.value)}
                />
            </div>

            <div className="social-row">
                <img src={linkedinIcon} alt="LinkedIn" />
                <input
                    type="url"
                    placeholder="LinkedIn URL"
                    value={links.linkedin}
                    onChange={(e) => handleChange("linkedin", e.target.value)}
                />
            </div>

            <div className="social-row">
                <img src={telegramIcon} alt="Telegram" />
                <input
                    type="url"
                    placeholder="Telegram URL"
                    value={links.telegram}
                    onChange={(e) => handleChange("telegram", e.target.value)}
                />
            </div>

            <div className="social-row">
                <img src={instagramIcon} alt="Instagram" />
                <input
                    type="url"
                    placeholder="Instagram URL"
                    value={links.instagram}
                    onChange={(e) => handleChange("instagram", e.target.value)}
                />
            </div>

            <button type="submit" className="save-social-btn">
                Save links
            </button>
        </form>
    );
}
