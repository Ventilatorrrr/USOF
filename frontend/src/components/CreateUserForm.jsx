import React, { useState } from "react";
import api from "../api/axiosInstance";
import { endpoints } from "../api/endpoints";
import "./CreateUserForm.css";

export default function CreateUserForm({ onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        login: "",
        full_name: "",
        email: "",
        password: "",
        password_confirmation: "",
        role: "user",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { data } = await api.post(endpoints.users.all(), formData);
            onSuccess?.(data);
        } catch (err) {
            console.error("createUser error:", err);
            setError(err.response?.data?.error || "Failed to create user");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-user-wrapper">
            <h2 className="page-title">Create New User</h2>

            <form className="create-user-form" onSubmit={handleSubmit}>
                <label>
                    Login:
                    <input name="login" value={formData.login} onChange={handleChange} required />
                </label>

                <label>
                    Full name:
                    <input name="full_name" value={formData.full_name} onChange={handleChange} required />
                </label>

                <label>
                    Email:
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </label>

                <label>
                    Password:
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                </label>

                <label>
                    Confirm password:
                    <input
                        type="password"
                        name="password_confirmation"
                        value={formData.password_confirmation}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label>
                    Role:
                    <select name="role" value={formData.role} onChange={handleChange}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </label>

                {error && <p className="error-text">{error}</p>}

                <div className="form-buttons">
                    <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? "Creating..." : "Create User"}
                    </button>
                </div>
            </form>
        </div>
    );
}
