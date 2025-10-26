import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateAvatar } from "../redux/slices/userSlice";
import "./AvatarUploader.css";

export default function AvatarUploader({ currentAvatar, userId, onDone }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(currentAvatar);
    const [error, setError] = useState(null);
    const dispatch = useDispatch();
    const status = useSelector((s) => s.user?.status) || "idle";

    const handleChange = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        if (!f.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }
        setError(null);
        setFile(f);
        setPreview(URL.createObjectURL(f));
    };

    const handleUpload = async () => {
        if (!file) return;
        try {
            await dispatch(updateAvatar({ file, userId })).unwrap();
            onDone?.();
        } catch (err) {
            setError(err.message || "Upload failed");
        }
    };

    return (
        <div className="avatar-uploader fancy">
            <div className="avatar-frame">
                <div className="avatar-circle">
                    <img src={preview} alt="Preview" className="avatar-img" />
                </div>
            </div>

            <label className="file-input-label">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    className="file-input"
                />
                <span className="btn uniform">Choose new photo</span>
            </label>

            {error && <p className="error-text">{error}</p>}

            <div className="btn-row">
                <button
                    onClick={handleUpload}
                    disabled={status === "loading" || !file}
                    className="btn primary uniform"
                >
                    {status === "loading" ? <span className="loader" /> : "Save avatar"}
                </button>

                <button
                    className="btn secondary uniform"
                    onClick={() => onDone?.()}
                    disabled={status === "loading"}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
