import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axiosInstance";

export const fetchReports = createAsyncThunk("reports/fetchAll", async (_, thunkAPI) => {
    try {
        const { data } = await api.get("/posts/admin/reports");
        return data;
    } catch (err) {
        return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to fetch reports");
    }
});

const reportSlice = createSlice({
    name: "reports",
    initialState: {
        list: [],
        status: "idle",
        error: null,
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchReports.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchReports.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.list = action.payload;
            })
            .addCase(fetchReports.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            });
    },
});

export default reportSlice.reducer;
