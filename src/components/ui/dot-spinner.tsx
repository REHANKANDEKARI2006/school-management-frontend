import React from "react";

export function DotSpinner({ className = "", style }: { className?: string, style?: React.CSSProperties }) {
  return (
    <div className={`dot-spinner ${className}`} style={style}>
      <div className="dot-spinner__dot"></div>
      <div className="dot-spinner__dot"></div>
      <div className="dot-spinner__dot"></div>
      <div className="dot-spinner__dot"></div>
      <div className="dot-spinner__dot"></div>
      <div className="dot-spinner__dot"></div>
      <div className="dot-spinner__dot"></div>
      <div className="dot-spinner__dot"></div>
    </div>
  );
}
