import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateUserLogin } from "../redux/slices/userSlice";
import "./EditLoginForm.css";

export default function EditLoginForm({ onClose, userId }) {
    const dispatch = useDispatch();
    const { user } = useSelector((s) => s.auth);
    const [newLogin, setNewLogin] = useState(user?.login || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newLogin.trim()) return setError("Login cannot be empty");

        setLoading(true);
        setError("");

        try {
            // 🔹 Передаємо userId, якщо є (для адміна)
            await dispatch(updateUserLogin({ newLogin, userId })).unwrap();
            setSuccess("✅ Login updated successfully!");
            setTimeout(onClose, 1000);
        } catch (err) {
            setError(err?.message || "❌ Failed to update login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="edit-login-form">
            <h3 className="form-title">Change user login</h3>

            <div className="form-group">
                <label htmlFor="newLogin">New login:</label>
                <input
                    id="newLogin"
                    type="text"
                    value={newLogin}
                    onChange={(e) => setNewLogin(e.target.value)}
                    placeholder="Enter new login..."
                    className="input-field"
                />
            </div>

            {error && <p className="error-text">{error}</p>}
            {success && <p className="success-text">{success}</p>}

            <div className="form-actions">
                <button type="submit" className="save-btn-login" disabled={loading}>
                    {loading ? "Saving..." : "Save"}
                </button>
                <button type="button" className="cancel-btn-login" onClick={onClose}>
                    Cancel
                </button>
            </div>
        </form>
    );
}
