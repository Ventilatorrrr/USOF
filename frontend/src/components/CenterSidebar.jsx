import React from "react";
import PostsList from "./PostsList";
import "./CenterSidebar.css";

export default function CenterSidebar({ posts }) {
    return (
        <div className="sidebar-box">
            <PostsList posts={posts} />
        </div>
    );
}
