import React, { useState } from "react";
import api from "../api/axiosInstance";
import { endpoints } from "../api/endpoints";
import "./CreateUserForm.css";

export default function CreateCategoryForm({
                                               onSuccess,
                                               onCancel,
                                               existingData = null,
                                               isEditMode = false,
                                           }) {
    const [title, setTitle] = useState(existingData?.title || "");
    const [description, setDescription] = useState(existingData?.description || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!title.trim()) {
            setError("Title is required");
            return;
        }

        setLoading(true);
        try {
            if (isEditMode && existingData?.id) {
                await api.patch(endpoints.categories.byId(existingData.id), {
                    title,
                    description,
                });
            } else {
                await api.post(endpoints.categories.all(), { title, description });
            }

            document.dispatchEvent(new CustomEvent("categoriesUpdated"));
            onSuccess?.();
        } catch (err) {
            console.error("create/update Category error:", err);
            setError(err.response?.data?.error || "Failed to save category");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-user-wrapper">
            {!isEditMode && (
                <h2 className="page-title">Create New Category</h2>
            )}

            <form className="create-user-form" onSubmit={handleSubmit}>
                <label>
                    Title:
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </label>

                <label>
                    Description:
                    <textarea
                        rows="5"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description..."
                    ></textarea>
                </label>

                {error && <p className="error-text">{error}</p>}

                <div className="form-buttons">
                    <button type="button" onClick={onCancel} className="cancel-btn">
                        Cancel
                    </button>
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading
                            ? isEditMode
                                ? "Saving..."
                                : "Creating..."
                            : isEditMode
                                ? "Save Changes"
                                : "Create Category"}
                    </button>
                </div>
            </form>
        </div>
    );
}
