//store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import postReducer from './slices/postSlice';
import commentReducer from './slices/commentSlice';
import categoryReducer from './slices/categorySlice';
import reportReducer from "./slices/reportSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        user: userReducer,
        posts: postReducer,
        comments: commentReducer,
        categories: categoryReducer,
        reports: reportReducer,
    },
});

export default store;
