import React from "react";

export function DotSpinner({ className = "h-10 w-10 text-indigo-600", style }: { className?: string, style?: React.CSSProperties }) {
  return (
    <div className="relative inline-flex items-center justify-center" style={style}>
      {/* Glowing background aura */}
      <div className="absolute inset-0 rounded-full bg-indigo-400/20 blur-md animate-pulse" />
      
      {/* Animated SVG Ring Spinner */}
      <svg
        className={`animate-spin relative z-10 ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-20 text-slate-400"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3.5"
        ></circle>
        <path
          className="opacity-90"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>

      {/* Inner pulsating core dot */}
      <div className="absolute h-2.5 w-2.5 rounded-full bg-indigo-600 animate-ping opacity-75" />
    </div>
  );
}
