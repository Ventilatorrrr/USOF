import { createAction, createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosInstance";
import { endpoints } from "../../api/endpoints";
import { fetchUserById } from "./userSlice";
import { fetchCurrentUser } from "./authSlice";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL

export const fetchPosts = createAsyncThunk(
    "posts/fetchAll",
    async (
        { authorId, likedBy, favoritedBy, page = 1, limit = 5, sort = "likes", categoryId, fromDate, toDate } = {},
        { dispatch }
    ) => {
        const params = { page, limit, sort };

        if (authorId) params.author_id = authorId;
        if (likedBy) params.liked_by = likedBy;
        if (favoritedBy) params.favorited_by = favoritedBy;
        if (categoryId) params.categoryId = categoryId;
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;

        const { data } = await api.get(endpoints.posts.all(), { params });

        const posts = data.posts || data;

        const uniqueAuthors = [...new Set(posts.map(p => p.author_id))];
        const authorsData = await Promise.all(
            uniqueAuthors.map(async (id) => {
                try {
                    const res = await dispatch(fetchUserById(id)).unwrap();
                    return { id, ...res };
                } catch {
                    return { id, login: "Unknown", avatar: null };
                }
            })
        );
        const authorsMap = Object.fromEntries(authorsData.map(u => [u.id, u]));

        const postsWithAuthors = posts.map(p => ({
            ...p,
            author: authorsMap[p.author_id] || { login: "Unknown", avatar: null },
            is_favorite: !!(p.is_favorite ?? p.user_fav),
            is_liked: p.is_liked ?? (p.user_is_like === 1),
            is_disliked: p.is_disliked ?? (p.user_is_like === 0),
        }));

        return { posts: postsWithAuthors, totalPages: data.totalPages || 1 };
    }
);

export const fetchPostById = createAsyncThunk(
    "posts/fetchById",
    async (id, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth.token;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const { data } = await api.get(endpoints.posts.byId(id), { headers });
            return data;
        } catch (err) {
            console.error("fetchPostById error:", err.response?.data || err.message);
            return rejectWithValue(err.response?.data || { error: err.message });
        }
    }
);

export const fetchPostComments = createAsyncThunk("posts/fetchComments", async (id) => {
    const { data } = await api.get(endpoints.posts.comments(id));
    return { postId: id, comments: data };
});

export const fetchPostCategories = createAsyncThunk("posts/fetchCategories", async (id) => {
    const { data } = await api.get(endpoints.posts.categories(id));
    return { postId: id, categories: data };
});

export const createPost = createAsyncThunk("posts/create", async (postData) => {
    const { data } = await api.post(endpoints.posts.create(), postData);
    return data;
});

export const likePost = createAsyncThunk(
    "posts/like",
    async ({ postId, is_like }, { dispatch, rejectWithValue }) => {
        try {
            const res = await fetch(`${API_URL}/posts/${postId}/like`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ is_like }),
            });

            const data = await res.json();
            if (!res.ok) return rejectWithValue(data);

            dispatch(fetchCurrentUser());

            if (data?.author_id) dispatch(fetchUserById(data.author_id));

            return data;
        } catch (e) {
            return rejectWithValue({ error: e.message });
        }
    }
);

export const favoritePost = createAsyncThunk("posts/favorite", async (postId) => {
    const { data } = await api.post(`/posts/${postId}/favorite`);
    return data;
});

export const reportPost = createAsyncThunk("posts/report", async ({ postId, reason }) => {
    await api.post(endpoints.posts.report(postId), { reason });
    return postId;
});

export const updatePost = createAsyncThunk(
    "posts/updatePost",
    async ({ postId, updates }) => {
        const { data } = await api.patch(endpoints.posts.byId(postId), updates);
        return data;
    }
);

export const deletePost = createAsyncThunk("posts/delete", async (postId) => {
    await api.delete(endpoints.posts.byId(postId));
    return postId;
});

export const deletePostLike = createAsyncThunk(
    "posts/deleteLike",
    async (postId, { dispatch, rejectWithValue }) => {
        try {
            const res = await fetch(`${API_URL}/posts/${postId}/like`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
            });

            const data = await res.json();
            if (!res.ok) return rejectWithValue(data);

            dispatch(fetchCurrentUser());

            if (data?.author_id) dispatch(fetchUserById(data.author_id));

            return data;
        } catch (e) {
            return rejectWithValue({ error: e.message });
        }
    }
);

export const unfavoritePost = createAsyncThunk("posts/unfavorite", async (postId) => {
    const { data } = await api.delete(`/posts/${postId}/favorite`);
    return data;
});

export const updateFavoriteLocal = createAction("posts/updateFavoriteLocal");


const applyReaction = (state, payload) => {
    const postId = payload.postId ?? payload.post_id;
    const { likes_count, dislikes_count, is_liked, is_disliked } = payload;

    const patch = (p) => {
        if (!p) return;
        if (likes_count !== undefined) p.likes_count = Number(likes_count);
        if (dislikes_count !== undefined) p.dislikes_count = Number(dislikes_count);
        if (is_liked !== undefined) p.is_liked = !!is_liked;
        if (is_disliked !== undefined) p.is_disliked = !!is_disliked;
    };

    const target = state.list.find((p) => p.id === postId);
    if (target) patch(target);

    if (state.selected?.id === postId) patch(state.selected);
};

export const lockPost = createAsyncThunk(
    "posts/lockPost",
    async (postId, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.patch(`${API_URL}/posts/${postId}/lock`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return { id: postId, ...res.data };
        } catch (err) {
            return rejectWithValue(err.response?.data || { error: "Failed to lock post" });
        }
    }
);

export const unlockPost = createAsyncThunk(
    "posts/unlockPost",
    async (postId, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.patch(`${API_URL}/posts/${postId}/unlock`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return { id: postId, ...res.data };
        } catch (err) {
            return rejectWithValue(err.response?.data || { error: "Failed to unlock post" });
        }
    }
);

// Slice
    const postSlice = createSlice({
        name: "posts",
    initialState: {
        list: [],
        totalPages: 1,
        selected: null,
        comments: {},
        categories: {},
        status: "idle",
        error: null,
    },
    reducers: {
        setPosts(state, action) {
            state.list = action.payload || [];
        },

        updateCommentsCount: (state, action) => {
            const { postId, total } = action.payload;

            const post = state.list.find((p) => p.id === Number(postId)) || state.selected;
            if (post) {
                post.comments_count = total;
            } else {
                console.warn("Post not found in Redux for ID:", postId);
            }
        },

    },
    extraReducers: (builder) => {
        builder

            .addCase(fetchPosts.pending, (state) => {
                state.status = "loading";
                state.list = [];
            })

            .addCase(fetchPosts.fulfilled, (state, action) => {
                state.status = "succeeded";

                const payload = action.payload;

                if (payload.posts) {
                    state.list = payload.posts;
                    state.totalPages = payload.totalPages || 1;
                }

                else if (Array.isArray(payload)) {
                    state.list = payload;
                    state.totalPages = 1;
                }

                else {
                    state.list = [];
                    state.totalPages = 1;
                }
            })
            .addCase(fetchPosts.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message;
            })


            .addCase(fetchPostById.fulfilled, (state, action) => {
                state.selected = action.payload;
            })


            .addCase(fetchPostComments.fulfilled, (state, action) => {
                state.comments[action.payload.postId] = action.payload.comments;
            })
            .addCase(fetchPostCategories.fulfilled, (state, action) => {
                state.categories[action.payload.postId] = action.payload.categories;
            })


            .addCase(createPost.fulfilled, (state, action) => {

                state.list.unshift(action.payload);

                const limit = 5;
                state.totalPages = Math.ceil(state.list.length / limit);
            })


            .addCase(updatePost.fulfilled, (state, action) => {
            const updatedPost = action.payload?.post;
            if (!updatedPost) return;

            if (typeof updatedPost.categories === "string") {
                try {
                    updatedPost.categories = JSON.parse(updatedPost.categories);
                } catch {
                    updatedPost.categories = [];
                }
            }

            const index = state.list.findIndex(p => p.id === updatedPost.id);
            if (index !== -1) {
                const prev = state.list[index];
                state.list[index] = {
                    ...prev,
                    ...updatedPost,
                    categories: updatedPost.categories ?? prev.categories,
                };
            }


            if (state.selected?.id === updatedPost.id) {
                const prev = state.selected;
                state.selected = {
                    ...prev,
                    ...updatedPost,
                    categories: updatedPost.categories ?? prev.categories,
                };
            }
            })

            .addCase(deletePost.fulfilled, (state, action) => {
                state.list = state.list.filter((p) => p.id !== action.payload);
                if (state.selected?.id === action.payload) state.selected = null;
            })


            .addCase(likePost.pending, (state, action) => {
                const { postId, is_like } = action.meta.arg;

                const normalize = (p) => {
                    if (!p) return;
                    p.likes_count = Number(p.likes_count ?? 0);
                    p.dislikes_count = Number(p.dislikes_count ?? 0);
                };

                const apply = (p) => {
                    if (!p) return;
                    normalize(p);
                    if (is_like) {
                        if (p.is_disliked) {
                            p.is_disliked = false;
                            p.dislikes_count = Math.max(p.dislikes_count - 1, 0);
                        }
                        if (!p.is_liked) {
                            p.is_liked = true;
                            p.likes_count = p.likes_count + 1;
                        }
                    } else {
                        if (p.is_liked) {
                            p.is_liked = false;
                            p.likes_count = Math.max(p.likes_count - 1, 0);
                        }
                        if (!p.is_disliked) {
                            p.is_disliked = true;
                            p.dislikes_count = p.dislikes_count + 1;
                        }
                    }
                };

                apply(state.list.find(p => p.id === postId));
                if (state.selected?.id === postId) apply(state.selected);
            })

            .addCase(deletePostLike.pending, (state, action) => {
                const postId = action.meta.arg;

                const normalize = (p) => {
                    if (!p) return;
                    p.likes_count = Number(p.likes_count ?? 0);
                    p.dislikes_count = Number(p.dislikes_count ?? 0);
                };

                const apply = (p) => {
                    if (!p) return;
                    normalize(p);
                    if (p.is_liked) {
                        p.is_liked = false;
                        p.likes_count = Math.max(p.likes_count - 1, 0);
                    } else if (p.is_disliked) {
                        p.is_disliked = false;
                        p.dislikes_count = Math.max(p.dislikes_count - 1, 0);
                    }
                };

                apply(state.list.find(p => p.id === postId));
                if (state.selected?.id === postId) apply(state.selected);
            })

            .addCase(likePost.fulfilled, (state, action) => {
                const { postId, likes_count, dislikes_count, is_liked, is_disliked } = action.payload;
                const post = state.list.find(p => p.id === postId);
                if (post) {
                    post.likes_count = likes_count;
                    post.dislikes_count = dislikes_count;
                    post.is_liked = is_liked;
                    post.is_disliked = is_disliked;
                }
            })
            .addCase(likePost.rejected, (state, action) => {
                state.error = action.payload?.error || action.error?.message || null;
            })

            .addCase(deletePostLike.fulfilled, (state, action) => {
                applyReaction(state, action.payload);
            })
            .addCase(deletePostLike.rejected, (state, action) => {
                state.error = action.payload?.error || action.error?.message || null;
            })


            .addCase(favoritePost.fulfilled, (state, action) => {
                const { postId } = action.payload;
                const post = state.list.find(p => p.id === postId);
                if (post) post.is_favorite = true;
            })
            .addCase(favoritePost.pending, (state, action) => {
                const post = state.list.find(p => p.id === action.meta.arg);
                if (post) post.is_favorite = true;
                if (state.selected?.id === action.meta.arg) state.selected.is_favorite = true;
            })
            .addCase(favoritePost.rejected, (state, action) => {
                const id = action.meta.arg;
                const post = state.list.find(p => p.id === id);
                if (post) post.is_favorite = false;
                if (state.selected?.id === id) state.selected.is_favorite = false;
            })

            .addCase(unfavoritePost.fulfilled, (state, action) => {
                const { postId } = action.payload;
                const post = state.list.find(p => p.id === postId);
                if (post) post.is_favorite = false;
            })
            .addCase(unfavoritePost.pending, (state, action) => {
                const post = state.list.find(p => p.id === action.meta.arg);
                if (post) post.is_favorite = false;
                if (state.selected?.id === action.meta.arg) state.selected.is_favorite = false;
            })
            .addCase(unfavoritePost.rejected, (state, action) => {
                const id = action.meta.arg;
                const post = state.list.find(p => p.id === id);
                if (post) post.is_favorite = true;
                if (state.selected?.id === id) state.selected.is_favorite = true;
            })

            .addCase(updateFavoriteLocal, (state, action) => {
                const { postId, value } = action.payload;
                const post = state.list.find((p) => p.id === postId);
                if (post) post.is_favorite = value;
            })


            .addCase(reportPost.fulfilled, (_state, action) => {
                console.log(`Reported post ${action.payload}`);
            })

            .addCase(lockPost.fulfilled, (state, action) => {
                const { id } = action.payload;
                const post = state.list.find((p) => p.id === id);
                if (post) post.is_locked = true;
                if (state.selected?.id === id) state.selected.is_locked = true;
            })
            .addCase(unlockPost.fulfilled, (state, action) => {
                const { id } = action.payload;
                const post = state.list.find((p) => p.id === id);
                if (post) post.is_locked = false;
                if (state.selected?.id === id) state.selected.is_locked = false;
            });

    },
});

export default postSlice.reducer;
export const { updateCommentsCount } = postSlice.actions;

