/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps */
import React from "react";
import { Link } from "react-router-dom";
import "./EmailConfirmedPage.css";
import checkIcon from "../assets/images/interaction/check-icon.png";

export default function EmailConfirmedPage() {
    return (
        <div className="email-confirm-wrapper">
            <div className="email-confirm-card">
                <img src={checkIcon} alt="Confirmed" className="email-confirm-icon" />
                <h2>Email confirmed!</h2>
                <p>Your account has been successfully verified. You can now log in.</p>
                <Link to="/login" className="confirm-btn">Go to Login</Link>
            </div>
        </div>
    );
}
