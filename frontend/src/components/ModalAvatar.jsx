import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import "./ModalAvatar.css";

export default function ModalAvatar({ open, onClose, title, children }) {
    const overlayRef = useRef(null);
    const [visible, setVisible] = useState(open);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        if (open) {
            setVisible(true);
            setClosing(false);
        } else if (visible) {
            setClosing(true);
            const t = setTimeout(() => setVisible(false), 250); // тривалість анімації
            return () => clearTimeout(t);
        }
    }, [open]);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose?.();
        if (visible) document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [visible, onClose]);

    if (!visible) return null;

    const onOverlayClick = (e) => {
        if (e.target === overlayRef.current) onClose?.();
    };

    return ReactDOM.createPortal(
        <div
            className={`m-overlay ${closing ? "closing" : ""}`}
            ref={overlayRef}
            onMouseDown={onOverlayClick}
            aria-modal="true"
            role="dialog"
        >
            <div className={`m-dialog ${closing ? "closing" : ""}`} role="document">
                {title && (
                    <div className="m-header">
                        <h3 className="m-title">{title}</h3>
                        <button className="m-close" onClick={onClose} aria-label="Close">
                            ×
                        </button>
                    </div>
                )}
                <div className="m-body">{children}</div>
            </div>
        </div>,
        document.body
    );
}
