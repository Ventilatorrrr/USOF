import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosInstance";
import { endpoints } from "../../api/endpoints";
import { fetchCurrentUser } from "./authSlice";
import { fetchUserById } from "./userSlice";

export const fetchCommentById = createAsyncThunk("comments/fetchById", async (id, thunkAPI) => {
    try {
        const { data } = await api.get(endpoints.comments.byId(id));
        return data;
    } catch (err) {
        return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to fetch comment");
    }
});

export const createComment = createAsyncThunk(
    "comments/create",
    async ({ postId, content, parent_id = null }, thunkAPI) => {
        try {
            const { data } = await api.post(endpoints.posts.comments(postId), { content, parent_id });
            return { postId, comment: data };
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to create comment");
        }
    }
);

export const fetchCommentLikes = createAsyncThunk("comments/fetchLikes", async (id, thunkAPI) => {
    try {
        const { data } = await api.get(endpoints.comments.likes(id));
        return { commentId: id, likes: data };
    } catch (err) {
        return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to fetch likes");
    }
});

export const fetchCommentsByPost = createAsyncThunk(
    "comments/fetchByPost",
    async (postId, thunkAPI) => {
        try {
            const { data } = await api.get(`/posts/${postId}/comments`);

            thunkAPI.dispatch({
                type: "posts/updateCommentsCount",
                payload: { postId, total: data.total },
            });

            return { postId, comments: data.comments || [], total: data.total || 0 };
        } catch (err) {
            console.error("fetchCommentsByPost error:", err);
            return thunkAPI.rejectWithValue(
                err.response?.data?.error || "Failed to fetch comments"
            );
        }
    }
);

export const addCommentLike = createAsyncThunk(
    "comments/addLike",
    async ({ id, is_like }, { dispatch, rejectWithValue }) => {
        try {
            const { data } = await api.post(endpoints.comments.likes(id), { is_like });

            dispatch(fetchCurrentUser());

            if (data?.author_id) dispatch(fetchUserById(data.author_id));

            return { id, ...data };
        } catch (err) {
            console.error("Error liking comment:", err);
            return rejectWithValue(err.response?.data?.error || "Failed to add like");
        }
    }
);

export const deleteCommentLike = createAsyncThunk(
    "comments/deleteLike",
    async ({ id }, { dispatch, rejectWithValue }) => {
        try {
            const { data } = await api.delete(endpoints.comments.likes(id));

            dispatch(fetchCurrentUser());

            if (data?.author_id) dispatch(fetchUserById(data.author_id));

            return { id, ...data };
        } catch (err) {
            console.error("Error deleting comment like:", err);
            return rejectWithValue(err.response?.data?.error || "Failed to delete like");
        }
    }
);

export const updateCommentStatus = createAsyncThunk(
    "comments/updateStatus",
    async ({ id, status_comment, postId }, thunkAPI) => {
        try {
            await api.patch(endpoints.comments.byId(id), { status_comment });

            if (postId) await thunkAPI.dispatch(fetchCommentsByPost(postId));

            return { id, status_comment, postId };
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to update comment");
        }
    }
);

export const deleteComment = createAsyncThunk(
    "comments/delete",
    async ({ id, postId }, thunkAPI) => {
        try {

            await api.delete(endpoints.comments.byId(id));

            if (postId) {
                await thunkAPI.dispatch(fetchCommentsByPost(postId));
            }

            return id;
        } catch (err) {
            console.error("deleteComment error:", err);
            return thunkAPI.rejectWithValue(
                err.response?.data?.error || "Failed to delete comment"
            );
        }
    }
);

export const reportComment = createAsyncThunk(
    "comments/report",
    async ({ id, reason, postId }, thunkAPI) => {
        try {
            await api.post(endpoints.comments.report(id), { reason });
            await thunkAPI.dispatch(fetchCommentsByPost(postId));
            return { id, reason };
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to report comment");
        }
    }
);

export const lockComment = createAsyncThunk(
    "comments/lockComment",
    async ({ id, postId }, thunkAPI) => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await api.patch(`/comments/${id}/lock`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return { id, postId, is_locked: true, ...data };
        } catch (err) {
            console.error("lockComment error:", err);
            return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to lock comment");
        }
    }
);

export const unlockComment = createAsyncThunk(
    "comments/unlockComment",
    async ({ id, postId }, thunkAPI) => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await api.patch(`/comments/${id}/unlock`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return { id, postId, is_locked: false, ...data };
        } catch (err) {
            console.error("unlockComment error:", err);
            return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to unlock comment");
        }
    }
);

// Slice
const commentSlice = createSlice({
    name: "comments",
    initialState: {
        byPost: {},
        totals: {},
        list: [],
        selected: null,
        likes: {},
        status: "idle",
        error: null,
        message: null,
    },
    reducers: {
        clearByPost: (state, action) => {
            const postId = action.payload;
            if (state.byPost && state.byPost[postId]) {
                delete state.byPost[postId];
            }
        },
    },
    extraReducers: (builder) => {

        const findById = (list = [], id) => {
            for (const item of list) {
                if (item.id === id) return item;
                const found = findById(item.replies || [], id);
                if (found) return found;
            }
            return null;
        };

        builder

            .addCase(createComment.fulfilled, (state, action) => {
                const { postId, comment } = action.payload;

                const findParent = (list, parentId) => {
                    for (const item of list) {
                        if (item.id === parentId) return item;
                        const found = findParent(item.replies || [], parentId);
                        if (found) return found;
                    }
                    return null;
                };

                if (comment.parent_id) {
                    const parent = findParent(state.byPost[postId] || [], comment.parent_id);
                    if (parent) {
                        if (!Array.isArray(parent.replies)) parent.replies = [];
                        parent.replies.push({ ...comment, replies: [] });
                    } else {
                        state.byPost[postId] = [...(state.byPost[postId] || []), { ...comment, replies: [] }];
                    }
                }
                else {
                    if (!state.byPost[postId]) state.byPost[postId] = [];
                    state.byPost[postId].push({ ...comment, replies: [] });
                }

                state.totals[postId] = (state.totals[postId] || 0) + 1;
                state.status = "idle";
            })


            .addCase(fetchCommentById.fulfilled, (state, action) => {
                state.selected = action.payload;
            })


            .addCase(fetchCommentLikes.fulfilled, (state, action) => {
                state.likes[action.payload.commentId] = action.payload.likes;
            })

            .addCase(fetchCommentsByPost.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchCommentsByPost.fulfilled, (state, action) => {
                const { postId, comments, total } = action.payload;

                state.byPost[postId] = Array.isArray(comments) ? comments : [];
                state.totals[postId] = total ?? (comments?.length || 0);
                state.status = "idle";
            })

            .addCase(fetchCommentsByPost.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })

            .addCase(addCommentLike.pending, (state, action) => {

                const { id, comment_id } = action.meta.arg;
                const targetId = Number(comment_id || id);

                for (const postId in state.byPost) {
                    const freezeCounts = (list) =>
                        list.map((c) => {
                            if (Number(c.id) === targetId) {
                                return { ...c, likes_count: c.likes_count ?? 0, dislikes_count: c.dislikes_count ?? 0 };
                            }
                            if (c.replies?.length) return { ...c, replies: freezeCounts(c.replies) };
                            return c;
                        });
                    state.byPost[postId] = freezeCounts(state.byPost[postId]);
                }
            })


            .addCase(addCommentLike.fulfilled, (state, action) => {
                const {
                    id,
                    comment_id,
                    likes_count,
                    dislikes_count,
                    is_like,
                    is_liked,
                    is_disliked,
                } = action.payload;

                const targetId = Number(comment_id || id);

                for (const postId in state.byPost) {
                    const updateCounts = (list) =>
                        list.map((c) => {
                            if (Number(c.id) === targetId) {
                                return {
                                    ...c,

                                    likes_count:
                                        typeof likes_count === "number"
                                            ? likes_count
                                            : c.likes_count,
                                    dislikes_count:
                                        typeof dislikes_count === "number"
                                            ? dislikes_count
                                            : c.dislikes_count,
                                    user_is_like:
                                        is_liked
                                            ? 1
                                            : is_disliked
                                                ? 0
                                                : is_like === true
                                                    ? 1
                                                    : is_like === false
                                                        ? 0
                                                        : null,
                                };
                            }

                            if (c.replies?.length) {
                                return { ...c, replies: updateCounts(c.replies) };
                            }

                            return c;
                        });

                    state.byPost[postId] = updateCounts(state.byPost[postId]);
                }
            })


            .addCase(deleteCommentLike.fulfilled, (state, action) => {
                const { postId, id } = action.payload;
                const root = state.byPost[postId] || [];
                const node = findById(root, id);
                if (!node) return;

                const prev = node.user_is_like;
                if (prev === true) node.likes_count = Math.max(0, (node.likes_count || 0) - 1);
                if (prev === false) node.dislikes_count = Math.max(0, (node.dislikes_count || 0) - 1);
                node.user_is_like = null;

                state.message = "Comment like removed";
            })


            .addCase(updateCommentStatus.fulfilled, (state, action) => {
                const { id, status_comment, postId } = action.payload;

                const updateStatusRecursive = (list) => {
                    return list.map((c) => {
                        if (c.id === id) return { ...c, status_comment };
                        if (c.replies?.length) {
                            return { ...c, replies: updateStatusRecursive(c.replies) };
                        }
                        return c;
                    });
                };

                if (postId && state.byPost[postId]) {
                    state.byPost[postId] = updateStatusRecursive(state.byPost[postId]);
                }

                state.message = "Comment status updated";
            })


            .addCase(deleteComment.fulfilled, (state, action) => {
                state.list = state.list.filter((c) => c.id !== action.payload);
                state.message = "Comment deleted";
            })


            .addCase(reportComment.fulfilled, (state, action) => {
                state.message = "Comment reported";
            })
            .addCase(lockComment.fulfilled, (state, action) => {
                const { id, postId } = action.payload;
                const root = state.byPost[postId] || [];
                const node = findById(root, id);
                if (node) node.is_locked = true;
            })
            .addCase(unlockComment.fulfilled, (state, action) => {
                const { id, postId } = action.payload;
                const root = state.byPost[postId] || [];
                const node = findById(root, id);
                if (node) node.is_locked = false;
            });

    },
});

export const { clearByPost } = commentSlice.actions;
export default commentSlice.reducer;
