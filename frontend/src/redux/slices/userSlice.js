import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosInstance";
import { endpoints } from "../../api/endpoints";
import { setAuthUser } from "./authSlice";

export const fetchUsers = createAsyncThunk("users/fetchAll", async (_, thunkAPI) => {
    try {
        const { data } = await api.get(endpoints.users.all());
        return data;
    } catch (err) {
        console.error("fetchUsers error:", err.response || err.message || err);
        return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to fetch users");
    }
});

export const fetchUserById = createAsyncThunk("users/fetchById", async (id, thunkAPI) => {
    try {
        const { data } = await api.get(endpoints.users.byId(id));
        return data;
    } catch (err) {
        return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to fetch user");
    }
});

export const createUser = createAsyncThunk("users/create", async (userData, thunkAPI) => {
    try {
        const { data } = await api.post(endpoints.users.all, userData);
        return data;
    } catch (err) {
        return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to create user");
    }
});

export const updateUser = createAsyncThunk("users/update", async ({ id, updates }, thunkAPI) => {
    try {
        const { data } = await api.patch(endpoints.users.byId(id), updates);
        return { id, ...data };
    } catch (err) {
        return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to update user");
    }
});

export const deleteUser = createAsyncThunk("users/delete", async (id, thunkAPI) => {
    try {
        await api.delete(endpoints.users.byId(id));
        return id;
    } catch (err) {
        return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to delete user");
    }
});

export const updateUserLogin = createAsyncThunk(
    "auth/updateUserLogin",
    async ({ newLogin, userId }, { rejectWithValue, getState }) => {
        try {
            const token = getState().auth.token;
            const raw = process.env.REACT_APP_API_URL || "http://localhost:5000";
            const API_URL = raw.replace(/\/+$/, "").replace(/\/api$/, ""); // 🔹 видаляє зайве /api

            const endpoint = userId
                ? `${API_URL}/api/users/${userId}`
                : `${API_URL}/api/users/login`;

            const res = await fetch(endpoint, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ login: newLogin }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Update failed");

            return data.updatedUser || data.user || { login: newLogin };
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const updateAvatar = createAsyncThunk(
    "users/updateAvatar",
    async ({ file, userId }, { getState, dispatch, rejectWithValue }) => {
        try {
            const state = getState();
            const token = state.auth?.token;
            const raw = process.env.REACT_APP_API_URL || "http://localhost:5000";
            const API_URL = raw.replace(/\/+$/, "").replace(/\/api$/, "");

            const form = new FormData();
            form.append("avatar", file);

            const endpoint = userId
                ? `${API_URL}/api/users/${userId}/avatar`
                : `${API_URL}/api/users/avatar`;

            const res = await fetch(endpoint, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
                body: form,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Avatar update failed");

            const avatar =
                data.profile_picture ||
                data.avatar ||
                data.avatar_url ||
                `/uploads/avatars/${file.name}`;
            const updated_at = data.updated_at || new Date().toISOString();

            if (!userId || userId === state.auth?.user?.id) {
                const current = state.auth?.user || {};
                const nextUser = {
                    ...current,
                    profile_picture: avatar,
                    updated_at,
                };
                dispatch(setAuthUser(nextUser));
            }

            return { avatar, updated_at };
        } catch (e) {
            return rejectWithValue(e.message || "Upload failed");
        }
    }
);

// Slice
const userSlice = createSlice({
    name: "users",
    initialState: {
        list: [],
        selected: null,
        status: "idle",
        error: null,
        message: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder

            .addCase(fetchUsers.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.list = action.payload;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })


            .addCase(fetchUserById.fulfilled, (state, action) => {
                state.selected = action.payload;
            })


            .addCase(createUser.fulfilled, (state, action) => {
                state.list.push({ id: action.payload.id, ...action.meta.arg });
                state.message = action.payload.message;
            })


            .addCase(updateUser.fulfilled, (state, action) => {
                const index = state.list.findIndex((u) => u.id === action.payload.id);
                if (index !== -1) {
                    state.list[index] = { ...state.list[index], ...action.meta.arg.updates };
                }
                state.message = action.payload.message;
            })


            .addCase(deleteUser.fulfilled, (state, action) => {
                state.list = state.list.filter((u) => u.id !== action.payload);
                state.message = "User deleted";
            })


            .addCase(updateAvatar.pending,   (s)=>{ s.status='loading'; })
            .addCase(updateAvatar.fulfilled, (s, a) => {
                s.status = "succeeded";
                if (s.user) {
                    if (a.payload?.avatar) s.user.avatar = a.payload.avatar; // шлях із бекенду
                    s.user.updated_at = new Date().toISOString();            // тригер для v=
                }
            })
            .addCase(updateAvatar.rejected,  (s, a) => {
                s.status = "failed";
                s.error = a.payload || a.error?.message;
            })

            .addCase(updateUserLogin.fulfilled, (state, action) => {
                if (state.user) {
                    state.user.login = action.payload.login;
                } else {
                    state.user = action.payload;
                }
            });
    },
});

export default userSlice.reducer;
