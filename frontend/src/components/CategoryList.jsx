import React, { useEffect, useState } from "react";
import api from "../api/axiosInstance";
import { endpoints } from "../api/endpoints";
import { fetchCategories } from "../redux/slices/categorySlice";
import editIcon from "../assets/images/interaction/edit-icon.png";
import deleteIcon from "../assets/images/interaction/remove-icon.png";
import "./UserList.css";

export default function CategoryList({
                                         page = 1,
                                         onTotalPagesChange,
                                         onEditCategory,
                                         onDeleteCategory,
                                     }) {
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const { data } = await api.get(endpoints.categories.all());
                setCategories(Array.isArray(data) ? data : []);
                onTotalPagesChange?.(1);
            } catch (err) {
                console.error("Error loading categories:", err);
                setError("Failed to load categories");
            }
        };

        loadCategories();

        const reload = () => loadCategories();
        document.addEventListener("categoriesUpdated", reload);
        return () => document.removeEventListener("categoriesUpdated", reload);
    }, [page, onTotalPagesChange]);

    useEffect(() => {
        const refetch = () => fetchCategories();
        document.addEventListener("categoriesUpdated", refetch);
        return () => document.removeEventListener("categoriesUpdated", refetch);
    }, []);


    if (error) return <div className="error-text">{error}</div>;

    return (
        <div className="user-list">

            {categories.length === 0 ? (
                <p className="no-users-text">No categories found.</p>
            ) : (
                categories.map((cat) => (
                    <div key={cat.id} className="category-box-admin">
                        <div className="category-info-admin">
                            <div className="category-title-admin">{cat.title}</div>
                            {cat.description ? (
                                <p className="category-description">{cat.description}</p>
                            ) : (
                                <p className="category-description empty">
                                    No description provided.
                                </p>
                            )}
                        </div>

                        <div className="category-actions-admin">
                            <img
                                src={editIcon}
                                alt="edit"
                                className="category-action-icon"
                                onClick={() => onEditCategory?.(cat)}
                            />

                            <img
                                src={deleteIcon}
                                alt="delete"
                                className="category-action-icon"
                                onClick={() => onDeleteCategory?.(cat)}
                            />
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
