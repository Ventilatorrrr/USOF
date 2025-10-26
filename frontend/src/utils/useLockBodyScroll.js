// src/hooks/useLockBodyScroll.js
import { useLayoutEffect } from "react";

export default function useLockBodyScroll(locked){
    useLayoutEffect(() => {
        if (!locked) return;
        const original = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = original; };
    }, [locked]);
}
