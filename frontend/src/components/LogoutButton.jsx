import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/slices/authSlice";
import { useNavigate } from "react-router-dom";

export default function LogoutButton({ redirectTo = "/" }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const status = useSelector(s => s.auth.status);
    const isLoading = status === "loading" || status === "loggingOut";

    const onLogout = async (e) => {
        e?.preventDefault?.();
        try {
            await dispatch(logout()).unwrap();
            navigate(redirectTo);
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    return (
        <button
            type="button"
            onClick={onLogout}
            disabled={isLoading}
            className="btn btn-logout"
            title="Logout"
        >
            {isLoading ? "Logging out..." : "Logout"}
        </button>
    );
}
