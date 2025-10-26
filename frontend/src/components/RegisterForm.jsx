import React, { useState } from "react";
import "./RegisterForm.css";
import registerImage from "../assets/images/logo/register-form.png";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { register } from "../redux/slices/authSlice";

export default function RegisterForm() {
    const dispatch = useDispatch();
    const { status } = useSelector((state) => state.auth);

    const [form, setForm] = useState({
        fullName: "",
        email: "",
        login: "",
        password: "",
        repeatPassword: ""
    });

    const [message, setMessage] = useState("");
    const [msgType, setMsgType] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setMsgType("");

        if (form.password !== form.repeatPassword) {
            setMessage("Passwords do not match!");
            setMsgType("error");
            return;
        }

        try {
            const payload = {
                login: form.login,
                password: form.password,
                password_confirmation: form.repeatPassword,
                full_name: form.fullName,
                email: form.email,
            };

            const result = await dispatch(register(payload));

            if (result.meta.requestStatus === "fulfilled") {

                setMessage("Registration successful! Please check your email to confirm your account.");
                setMsgType("success");
            } else {

                const errMsg = result.payload || "Registration failed. Please try again later.";
                setMessage(errMsg);
                setMsgType("error");
            }
        } catch (err) {
            console.error("Registration error:", err);
            setMessage("Server error. Please try again later.");
            setMsgType("error");
        }
    };

    return (
        <div className="register-wrapper">
            <div className="register-box">

                <div className="register-image">
                    <img src={registerImage} alt="Register visual" />
                </div>

                <div className="register-container">
                    <form className="register-form" onSubmit={handleSubmit}>
                        <h2 className="register-title">Sign Up</h2>

                        <p>Full name:</p>
                        <input
                            type="text"
                            name="fullName"
                            value={form.fullName}
                            onChange={handleChange}
                            required
                        />

                        <p>Email:</p>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />

                        <p>Login:</p>
                        <input
                            type="text"
                            name="login"
                            value={form.login}
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

                        <p>Repeat Password:</p>
                        <input
                            type="password"
                            name="repeatPassword"
                            value={form.repeatPassword}
                            onChange={handleChange}
                            required
                        />

                        <button
                            type="submit"
                            className="register-btn"
                            disabled={status === "loading"}
                        >
                            {status === "loading" ? "Registering..." : "Register"}
                        </button>

                        {message && (
                            <div
                                className={`alert ${
                                    msgType === "success"
                                        ? "alert-success"
                                        : "alert-error"
                                }`}
                            >
                                {message}
                            </div>
                        )}

                        <div className="login-link">
                            Already registered? <Link to="/login">Login</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
