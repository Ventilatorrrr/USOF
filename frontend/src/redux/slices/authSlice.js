//authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosInstance";
import { endpoints } from "../../api/endpoints";
import { jwtDecode } from "jwt-decode";

export const login = createAsyncThunk("auth/login", async (credentials, thunkAPI) => {
    try {
        const { data } = await api.post(endpoints.auth.login(), credentials);

        if (data.token) {
            localStorage.setItem("token", data.token);
        }

        return data;
    } catch (err) {
        const status = err.response?.status;
        const serverError = err.response?.data?.error;

        console.warn("Login error:", status, serverError);

        if (status === 403) {
            return thunkAPI.rejectWithValue("Please confirm your email before logging in.");
        }

        if (status === 401) {
            return thunkAPI.rejectWithValue("Invalid login or password.");
        }

        return thunkAPI.rejectWithValue(serverError || "Login failed. Please try again.");
    }
});

export const register = createAsyncThunk("auth/register", async (userData, thunkAPI) => {
    try {
        const { data } = await api.post(endpoints.auth.register(), userData);
        return data;
    } catch (err) {
        console.error("Registration error:", err.response?.data);
        return thunkAPI.rejectWithValue(err.response?.data?.error || "Register failed");
    }
});

export const logout = createAsyncThunk("auth/logout", async (_, thunkAPI) => {
    try {
        await api.post(endpoints.auth.logout());
        localStorage.removeItem("token");
        return true;
    } catch (err) {
        return thunkAPI.rejectWithValue(err.response?.data?.error || "Logout failed");
    }
});

export const passwordResetRequest = createAsyncThunk(
    "auth/passwordResetRequest",
    async (email, thunkAPI) => {
        try {
            const { data } = await api.post("/auth/password-reset", { email });
            return data.message;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data?.error || "Password reset request failed");
        }
    }
);

export const passwordResetConfirm = createAsyncThunk(
    "auth/passwordResetConfirm",
    async ({ token, newPassword }, thunkAPI) => {
        try {
            const { data } = await api.post(`/auth/password-reset/${token}`, { newPassword });
            return data.message;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data?.error || "Password reset failed");
        }
    }
);

export const confirmEmail = createAsyncThunk("auth/confirmEmail", async (token, thunkAPI) => {
    try {
        const { data } = await api.get(endpoints.auth.confirmEmail(token));
        return data.message;
    } catch (err) {
        return thunkAPI.rejectWithValue(err.response?.data?.error || "Email confirmation failed");
    }
});

export const fetchCurrentUser = createAsyncThunk(
    "auth/fetchCurrentUser",
    async (_, thunkAPI) => {
        const token = localStorage.getItem("token");
        if (!token) {
            return null;
        }

        try {
            const decoded = jwtDecode(token);
            const { data } = await api.get(`/users/${decoded.id}`, {
                 params: { _ts: Date.now() },
            });
            return data;
        } catch (err) {
            console.error("Failed to fetch user:", err);
            return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to fetch user");
        }
    }
);

export const updateUserSocials = createAsyncThunk(
    "auth/updateUserSocials",
    async (social_links, { rejectWithValue, getState }) => {
        try {
            const token = getState().auth.token;
            const res = await fetch(`${process.env.REACT_APP_API_URL}/users/socials`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ social_links }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update socials");
            return data.social_links;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const fetchUserById = createAsyncThunk(
    "auth/fetchUserById",
    async (id, thunkAPI) => {
        try {
            const { data } = await api.get(`/users/${id}`);
            return data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to fetch user");
        }
    }
);

// Slice

const authSlice = createSlice({
    name: "auth",
    initialState: {
        user: undefined,
        token: localStorage.getItem("token") || null,
        viewedUser: null,
        status: "idle",
        error: null,
        message: null,
    },
    reducers: {
        setAuthUser(state, action) {
            state.user = action.payload;
        },
        mergeAuthUser(state, action) {
            state.user = { ...(state.user || {}), ...(action.payload || {}) };
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.token = action.payload.token;
                state.user = action.payload.user || null;
            })
            .addCase(login.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })


            .addCase(fetchCurrentUser.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.user = action.payload;
            })
            .addCase(fetchCurrentUser.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
                localStorage.removeItem("token");
                state.token = null;
                state.user = null;
            })


            .addCase(register.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.token = action.payload.token;
                state.message = action.payload.message;
                state.error = null;
            })

            .addCase(register.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })


            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.status = "idle";
            })


            .addCase(passwordResetRequest.fulfilled, (state, action) => {
                state.message = action.payload;
            })
            .addCase(passwordResetConfirm.fulfilled, (state, action) => {
                state.message = action.payload;
            })


            .addCase(confirmEmail.fulfilled, (state, action) => {
                state.message = action.payload;
            })


            .addCase(fetchUserById.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchUserById.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.viewedUser = action.payload;
            })
            .addCase(fetchUserById.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            });
    },
});

export const { setAuthUser, mergeAuthUser } = authSlice.actions;
export default authSlice.reducer;
