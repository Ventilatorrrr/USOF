import React from "react";
import "./UserList.css";

export default function ReportList({ reports, onView, onDelete }) {
    if (!reports?.length) return <p className="no-reports">No reports found.</p>;

    return (
        <div className="report-list">
            {reports.map((r) => {
                const isPost = !!r.post_id;
                const type = isPost ? "Post" : "Comment";

                return (
                    <div key={r.id} className="report-card">

                        <div className="report-top">
                            <div className="report-meta">
                                <span className="report-author">{r.author} | </span>
                                <span className="report-date">
                                    {new Date(r.created_at).toLocaleString()}
                                </span>
                            </div>
                            <div className={`report-type ${isPost ? "post" : "comment"}`}>
                                {type}
                            </div>
                        </div>

                        <div className="report-target">
                            {isPost ? (
                                <>
                                    <strong>Post:</strong> {r.post_title || "—"}
                                </>
                            ) : (
                                <>
                                    <strong>Comment:</strong> {r.comment_content || "—"}
                                </>
                            )}
                        </div>

                        <div className="report-reason">
                            <strong>Reason:</strong> {r.reason}
                        </div>

                        <div className="report-actions">
                            <button className="view-btn" onClick={() => onView(r)}>View</button>
                            <button className="view-btn" onClick={() => onDelete(r)}>Delete</button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}