import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { confirmEmail } from "../redux/slices/authSlice";

export default function ConfirmEmailPage() {
    const { token } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    useEffect(() => {
        if (token) {
            dispatch(confirmEmail(token))
                .unwrap()
                .then(() => {
                    navigate("/email-confirmed");
                })
                .catch((err) => {
                    setError(err || "Email confirmation failed");
                });
        }
    }, [token, dispatch, navigate]);

    if (error) {
        return (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
                <h2>{error}</h2>
                <p>The token is invalid or has expired.</p>
            </div>
        );
    }

    return (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <h2>Confirming your email address...</h2>
        </div>
    );
}