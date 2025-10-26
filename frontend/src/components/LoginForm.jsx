import React, { useState } from "react";
import "./LoginForm.css";
import loginImage from "../assets/images/logo/register-form.png";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login, fetchCurrentUser, passwordResetRequest } from "../redux/slices/authSlice";

export default function LoginForm() {
    const [form, setForm] = useState({ loginOrEmail: "", password: "" });
    const [error, setError] = useState("");
    const [showReset, setShowReset] = useState(false);
    const [email, setEmail] = useState("");
    const [resetMsg, setResetMsg] = useState("");

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const result = await dispatch(login(form));

            if (result.meta.requestStatus === "fulfilled") {
                await dispatch(fetchCurrentUser());
                navigate("/");
            } else {
                setError(result.payload || "Invalid login or password");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("Login failed. Please try again.");
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setResetMsg("");
        if (!email) return setResetMsg("Please enter your email.");

        try {
            const res = await dispatch(passwordResetRequest(email));
            if (res.meta.requestStatus === "fulfilled") {
                setResetMsg("A reset link has been sent to your email.");
            } else {
                setResetMsg("Failed to send reset email.");
            }
        } catch {
            setResetMsg("Server error. Please try again later.");
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-box">
                <div className="login-image">
                    <img src={loginImage} alt="Login visual" />
                </div>

                <div className="login-container">
                    {!showReset ? (
                        <form className="login-form" onSubmit={handleSubmit}>
                            <h2 className="login-title">Sign In</h2>

                            <p>Login or email:</p>
                            <input
                                type="text"
                                name="loginOrEmail"
                                value={form.loginOrEmail}
                                onChange={handleChange}
                                required
                            />

                            <p>Password:</p>
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />

                            <button type="submit" className="login-btn">
                                Login
                            </button>

                            <button
                                type="button"
                                className="reset-btn"
                                onClick={() => setShowReset(true)}
                            >
                                Forgot password?
                            </button>

                            {error && <div className="alert alert-error">{error}</div>}

                            <div className="register-link">
                                Don’t have an account? <Link to="/register">Register</Link>
                            </div>
                        </form>
                    ) : (
                        <form className="login-form" onSubmit={handleReset}>
                            <h2 className="login-title">Password Reset</h2>
                            <p>Enter your email:</p>

                            <input
                                type="email"
                                placeholder="Your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                            <button type="submit" className="login-btn">
                                Send link
                            </button>

                            <button
                                type="button"
                                className="reset-btn"
                                onClick={() => setShowReset(false)}
                            >
                                Back to login
                            </button>

                            {resetMsg && (
                                <div
                                    className={`alert ${
                                        resetMsg.toLowerCase().includes("sent")
                                            ? "alert-success"
                                            : "alert-error"
                                    }`}
                                >
                                    {resetMsg}
                                </div>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
