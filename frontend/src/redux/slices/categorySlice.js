import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosInstance";
import { endpoints } from "../../api/endpoints";

export const fetchCategories = createAsyncThunk("categories/fetchAll", async (_, thunkAPI) => {
    try {
        const { data } = await api.get(endpoints.categories.all());
        return data;
    } catch (err) {
        return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to fetch categories");
    }
});

export const fetchCategoryById = createAsyncThunk("categories/fetchById", async (id, thunkAPI) => {
    try {
        const { data } = await api.get(endpoints.categories.byId(id));
        return data;
    } catch (err) {
        return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to fetch category");
    }
});

export const fetchCategoryPosts = createAsyncThunk("categories/fetchPosts", async (id, thunkAPI) => {
    try {
        const { data } = await api.get(endpoints.categories.posts(id));
        return { categoryId: id, posts: data };
    } catch (err) {
        return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to fetch posts for category");
    }
});

export const createCategory = createAsyncThunk("categories/create", async (categoryData, thunkAPI) => {
    try {
        const { data } = await api.post(endpoints.categories.all(), categoryData);
        return { id: data.category_id, ...categoryData };
    } catch (err) {
        return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to create category");
    }
});

export const updateCategory = createAsyncThunk("categories/update", async ({ id, updates }, thunkAPI) => {
    try {
        await api.patch(endpoints.categories.byId(id), updates);
        return { id, updates };
    } catch (err) {
        return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to update category");
    }
});

export const deleteCategory = createAsyncThunk("categories/delete", async (id, thunkAPI) => {
    try {
        await api.delete(endpoints.categories.byId(id));
        return id;
    } catch (err) {
        return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to delete category");
    }
});

// Slice
const categorySlice = createSlice({
    name: "categories",
    initialState: {
        list: [],
        selected: null,
        postsByCategory: {},
        status: "idle",
        error: null,
        message: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder

            .addCase(fetchCategories.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.list = action.payload;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })


            .addCase(fetchCategoryById.fulfilled, (state, action) => {
                state.selected = action.payload;
            })


            .addCase(fetchCategoryPosts.fulfilled, (state, action) => {
                state.postsByCategory[action.payload.categoryId] = action.payload.posts;
            })


            .addCase(createCategory.fulfilled, (state, action) => {
                state.list.push(action.payload);
                state.message = "Category created";
            })


            .addCase(updateCategory.fulfilled, (state, action) => {
                const index = state.list.findIndex((c) => c.id === action.payload.id);
                if (index !== -1) {
                    state.list[index] = { ...state.list[index], ...action.payload.updates };
                }
                state.message = "Category updated";
            })


            .addCase(deleteCategory.fulfilled, (state, action) => {
                state.list = state.list.filter((c) => c.id !== action.payload);
                state.message = "Category deleted";
            });
    },
});

export default categorySlice.reducer;
