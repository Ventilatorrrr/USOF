import React, { useState } from "react";
import { useSelector } from "react-redux";

import ProfileSidebar from "../components/ProfileSidebar";
import RightSidebarAdmin from "../components/RightSidebarAdmin";
import Pagination from "../components/Pagination";
import UserList from "../components/UserList";
import CreateUserForm from "../components/CreateUserForm";

import "./MainPage.css";

export default function AdminUsersPage() {
    const { user } = useSelector((s) => s.auth);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showCreateForm, setShowCreateForm] = useState(false);

    return (
        <div className="page-container">
            <div className="page-layout">
                <div className="left-column">
                    <ProfileSidebar user={user} />
                </div>

                <div className="center-column fade-wrapper">
                    <div className="fade-in">
                        {showCreateForm ? (
                            <CreateUserForm
                                onSuccess={() => {
                                    setShowCreateForm(false);
                                }}
                                onCancel={() => setShowCreateForm(false)}
                            />
                        ) : (
                            <UserList
                                page={currentPage}
                                onTotalPagesChange={(pages) => setTotalPages(pages)}
                            />
                        )}
                    </div>
                </div>

                <div className="right-column">
                    <RightSidebarAdmin
                        onCreateUser={() => setShowCreateForm(true)}
                    />
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
        </div>
    );
}
