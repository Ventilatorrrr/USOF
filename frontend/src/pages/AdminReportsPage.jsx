import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchReports } from "../redux/slices/reportSlice";
import { deletePost } from "../redux/slices/postSlice";
import { deleteComment } from "../redux/slices/commentSlice";
import ProfileSidebar from "../components/ProfileSidebar";
import RightSidebarAdmin from "../components/RightSidebarAdmin";
import ReportList from "../components/ReportList";
import Modal from "../components/Modal";
import useLockBodyScroll from "../utils/useLockBodyScroll";
import "./MainPage.css";

export default function AdminReportsPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { list: reports, status } = useSelector((s) => s.reports);
    const { user } = useSelector((s) => s.auth);
    const [deleteModalData, setDeleteModalData] = useState(null);
    useLockBodyScroll(!!deleteModalData);

    useEffect(() => {
        dispatch(fetchReports());
    }, [dispatch]);

    const handleDelete = (report) => {
        const isPost = !!report.post_id;
        setDeleteModalData({
            ...report,
            type: isPost ? "post" : "comment",
            onConfirm: async () => {
                try {
                    if (isPost) {
                        await dispatch(deletePost(report.post_id)).unwrap();
                    } else {
                        await dispatch(
                            deleteComment({ id: report.comment_id, postId: report.post_id })
                        ).unwrap();
                    }
                    await dispatch(fetchReports()).unwrap();
                } catch (err) {
                    console.error("Delete error:", err);
                    alert("Failed to delete " + (isPost ? "post" : "comment"));
                }
            },
        });
    };

    const handleView = (report) => {
        const targetPostId = report.post_id || report.comment_post_id;
        if (targetPostId) {
            if (report.comment_id) {
                navigate(`/post/${targetPostId}#comment-${report.comment_id}`);
            } else {
                navigate(`/post/${targetPostId}`);
            }
        } else {
            console.warn("No valid post reference for report:", report);
        }
    };

    return (
        <div className="page-container">
            <div className="page-layout">
                <div className="left-column">
                    <ProfileSidebar user={user} />
                </div>

                <div className="center-column fade-wrapper">
                    <div className="fade-in">
                        {status === "loading" && <p>Loading reports...</p>}
                        {status === "failed" && <p>Failed to load reports.</p>}
                        {status === "succeeded" && (
                            <ReportList
                                reports={reports}
                                onView={handleView}
                                onDelete={handleDelete}
                            />
                        )}
                    </div>
                </div>

                <div className="right-column">
                    <RightSidebarAdmin />
                </div>
            </div>

            {deleteModalData && (
                <Modal
                    title={`Confirm ${deleteModalData.type === "post" ? "Post" : "Comment"} Deletion`}
                    onClose={() => setDeleteModalData(null)}
                >
                    <div style={{ textAlign: "center" }}>
                        <p>
                            Are you sure you want to delete this{" "}
                            <strong>{deleteModalData.type}</strong>?
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
                                onClick={async () => {
                                    await deleteModalData.onConfirm?.();
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
