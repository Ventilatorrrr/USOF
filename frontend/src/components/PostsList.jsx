import React from "react";
import { Link } from "react-router-dom";
import PostCard from "./PostCard";
import "./PostsList.css";

export default function PostsList({
                                      posts = [],
                                      onToggleFavorite,
                                      onCommentCreated,
                                  })
 {
    if (!Array.isArray(posts) || posts.length === 0) {
        return <p className="no-posts">No posts found.</p>;
    }

    return (
        <div className="posts-grid fade-in">
            {posts.map((post) => (
                <Link
                    key={post.id}
                    to={`/post/${post.id}`}
                    state={{ post }}
                    className="post-card-link"
                >
                    <PostCard
                        post={post}
                        className="limited-height"
                        onToggleFavorite={onToggleFavorite}
                        onCommentCreated={onCommentCreated}
                        showMenu={false}
                    />
                </Link>
            ))}
        </div>
    );
}
