import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { passwordResetConfirm } from "../redux/slices/authSlice";
import loginImage from "../assets/images/logo/register-form.png";
import "../components/LoginForm.css";

export default function PasswordResetConfirmPage() {
    const { token } = useParams();
    const [newPassword, setNewPassword] = useState("");
    const [msg, setMsg] = useState("");
    const [msgType, setMsgType] = useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg("");
        setMsgType("");
        try {
            const res = await dispatch(passwordResetConfirm({ token, newPassword }));

            if (res.meta.requestStatus === "fulfilled") {
                setMsg("Password updated successfully! Redirecting to login...");
                setMsgType("success");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                setMsg("Failed to update password. The link may be invalid or expired.");
                setMsgType("error");
            }
        } catch {
            setMsg("Server error. Please try again later.");
            setMsgType("error");
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-box">

                <div className="login-image">
                    <img src={loginImage} alt="Reset visual" />
                </div>

                <div className="login-container">
                    <form className="login-form" onSubmit={handleSubmit}>
                        <h2 className="login-title">Set New Password</h2>

                        <p>Enter new password:</p>

                        <input
                            type="password"
                            placeholder="New password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />

                        <button type="submit" className="login-btn">
                            Confirm
                        </button>
                    </form>

                    {msg && (
                        <div className={`alert ${msgType === "success" ? "alert-success" : "alert-error"}`}>
                            {msg}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
