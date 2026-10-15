/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps */
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { deleteCategory } from "../redux/slices/categorySlice";

import ProfileSidebar from "../components/ProfileSidebar";
import RightSidebarAdmin from "../components/RightSidebarAdmin";
import Pagination from "../components/Pagination";
import CategoryList from "../components/CategoryList";
import CreateCategoryForm from "../components/CreateCategoryForm";
import Modal from "../components/Modal";
import useLockBodyScroll from "../utils/useLockBodyScroll";

import "./MainPage.css";

export default function AdminCategoriesPage() {
    const { user } = useSelector((s) => s.auth);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const dispatch = useDispatch();

    const [editModalData, setEditModalData] = useState(null);
    const [deleteModalData, setDeleteModalData] = useState(null);

    useLockBodyScroll(!!editModalData || !!deleteModalData );

    const handleEditCategory = (cat) => {
        setEditModalData(cat);
    };

    const handleDeleteCategory = (cat) => {
        setDeleteModalData({
            ...cat,
            onConfirm: async (id) => {
                try {
                    await dispatch(deleteCategory(id)).unwrap();
                    document.dispatchEvent(new CustomEvent("categoriesUpdated"));
                } catch (err) {
                    console.error("Error deleting category:", err);
                    alert("Failed to delete category");
                }
            },
        });
    };

    return (
        <div className="page-container">
            <div className="page-layout">

                <div className="left-column">
                    <ProfileSidebar user={user} />
                </div>

                <div className="center-column fade-wrapper">
                    <div className="fade-in">
                        {showCreateForm ? (
                            <CreateCategoryForm
                                onSuccess={() => setShowCreateForm(false)}
                                onCancel={() => setShowCreateForm(false)}
                            />
                        ) : (
                            <CategoryList
                                key={Date.now()}
                                page={currentPage}
                                onTotalPagesChange={(pages) => setTotalPages(pages)}
                                onEditCategory={handleEditCategory}
                                onDeleteCategory={handleDeleteCategory}
                            />
                        )}
                    </div>
                </div>

                <div className="right-column">
                    <RightSidebarAdmin onCreateCategory={() => setShowCreateForm(true)} />
                </div>
            </div>


            {!showCreateForm && (
                <div className="pagination-wrapper-full">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page) => {
                            setCurrentPage(page);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                    />
                </div>
            )}

            {editModalData && (
                <Modal
                    title={`Edit Category: ${editModalData.title}`}
                    onClose={() => setEditModalData(null)}
                >
                    <CreateCategoryForm
                        existingData={editModalData}
                        onSuccess={() => setEditModalData(null)}
                        onCancel={() => setEditModalData(null)}
                        isEditMode
                    />
                </Modal>
            )}

            {deleteModalData && (
                <Modal
                    title="Confirm Deletion"
                    onClose={() => setDeleteModalData(null)}
                >
                    <div style={{ textAlign: "center" }}>
                        <p>
                            Are you sure you want to delete category{" "}
                            <strong>{deleteModalData.title}</strong>?
                        </p>
                        <div className="form-buttons" style={{ justifyContent: "center" }}>
                            <button
                                className="cancel-btn"
                                onClick={() => setDeleteModalData(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="submit-btn"
                                onClick={() => {
                                    deleteModalData.onConfirm?.(deleteModalData.id);
                                    setDeleteModalData(null);
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
