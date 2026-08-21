"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";

export default function Modal({
  children,
  onClose,
  closed,
  intro = false,
  addFnc,
  className = "",
  disableClose = false,
}: {
  children: React.ReactNode;
  onClose: () => void;
  closed?: boolean;
  intro?: boolean;
  addFnc?: () => void;
  className?: string;
  disableClose?: boolean;
}) {
  const [close, setClose] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  const handleClose = useCallback(() => {
    setClose(true);
    timeoutRef.current = setTimeout(() => {
      if (typeof addFnc === "function") {
        addFnc();
      }
      onClose();
    }, 200);
  }, [addFnc, onClose]);

  useEffect(() => {
    if (closed) {
      handleClose();
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [closed, handleClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disableClose) return;
    if (ref.current && !ref.current.contains(e.target as Node)) {
      handleClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className={`fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[9999] p-4 transition-opacity duration-200 ${
        intro ? "animate-fadeInIntro" : "animate-fadeIn"
      } ${close ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      <div
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg mx-auto transform transition-all duration-200 animate-popUp ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
