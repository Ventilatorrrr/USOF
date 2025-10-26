import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updatePost } from "../redux/slices/postSlice";
import "./EditPostForm.css";

export default function EditPostForm({ post, onClose, isAdmin = false }) {
    const dispatch = useDispatch();
    const { user } = useSelector((s) => s.auth);

    const [categories, setCategories] = useState([]);
    const [selectedCats, setSelectedCats] = useState(() => {
        let cats = post.categories;
        if (typeof cats === "string") {
            try {
                cats = JSON.parse(cats);
            } catch {
                cats = [];
            }
        }
        return Array.isArray(cats) ? cats.map((c) => c.id) : [];
    });

    const [form, setForm] = useState({
        title: post.title,
        content: post.content,
    });

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/categories`)
            .then((res) => res.json())
            .then((data) => setCategories(data))
            .catch((err) => console.error("Error loading categories:", err));
    }, []);

    const toggleCategory = (id) => {
        setSelectedCats((prev) =>
            prev.includes(id)
                ? prev.filter((cid) => cid !== id)
                : [...prev, id]
        );
    };

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await dispatch(
                updatePost({
                    postId: post.id,
                    updates: {
                        ...(isAdmin
                            ? { categories: selectedCats }
                            : {
                                title: form.title.trim(),
                                content: form.content.trim(),
                                categories: selectedCats,
                            }),
                    },
                })
            ).unwrap();
            onClose();
        } catch (err) {
            console.error("❌ Failed to update post:", err);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="edit-post-form">
            {!isAdmin && (
                <>
                    <label>Title:</label>
                    <input
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        required
                    />

                    <label>Content:</label>
                    <textarea
                        name="content"
                        value={form.content}
                        onChange={handleChange}
                        rows={5}
                        required
                    />
                </>
            )}

            {isAdmin && (
                <p className="admin-info">
                    As admin, you can only change <b>categories</b>.
                </p>
            )}

            <label>Categories:</label>
            <div className="category-list-edit">
                {categories.map((cat) => (
                    <label
                        key={cat.id}
                        className={`category-chip ${
                            selectedCats.includes(cat.id) ? "selected" : ""
                        }`}
                    >
                        <input
                            type="checkbox"
                            checked={selectedCats.includes(cat.id)}
                            onChange={() => toggleCategory(cat.id)}
                        />
                        {cat.title}
                    </label>
                ))}
            </div>

            <div className="modal-buttons">
                <button type="submit" className="save-btn-edit">
                    Save
                </button>
                <button
                    type="button"
                    className="cancel-btn-edit"
                    onClick={onClose}
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
