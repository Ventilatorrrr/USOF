import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchCurrentUser } from "./redux/slices/authSlice";

import MainPage from "./pages/MainPage";
import Header from "./components/Header";
import Footer from "./components/Footer";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import PostPage from './pages/PostPage';
import AboutPage from "./pages/AboutPage";
import CreatePostPage from "./pages/CreatePostPage";
import PasswordResetConfirmPage from "./pages/PasswordResetConfirmPage";
import EmailConfirmedPage from "./pages/EmailConfirmedPage";
import ConfirmEmailPage from "./pages/ConfirmEmailPage";
import UserProfilePage from "./pages/UserProfilePage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminCategoriesPage from "./pages/AdminCategoriesPage";
import AdminReportsPage from "./pages/AdminReportsPage";

function App() {
    const location = useLocation();
    const dispatch = useDispatch();

    useEffect(() => {
        if (localStorage.getItem("token")) {
            dispatch(fetchCurrentUser());
        }
    }, [dispatch]);

    const hideLayoutRoutes = ["/register", "/login", "/password-reset/confirm/:token", "/email-confirmed"];
    const hideLayout = hideLayoutRoutes.some((route) =>
        location.pathname.startsWith(route.replace(":token", ""))
    );

    return (
        <>
            {!hideLayout && <Header />}

            <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/post/:id" element={<PostPage />}/>
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/user/:id" element={<UserProfilePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/create-post" element={<CreatePostPage />} />
                <Route path="/password-reset/confirm/:token" element={<PasswordResetConfirmPage />} />
                <Route path="/email-confirmed" element={<EmailConfirmedPage />} />
                <Route path="/confirm-email/:token" element={<ConfirmEmailPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                <Route path="/admin/reports" element={<AdminReportsPage />} />
            </Routes>

            {!hideLayout && <Footer />}
        </>
    );
}

export default App;

