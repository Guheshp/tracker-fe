"use client";

export function ShimmerBox({ className = "", style }) {
  return (
    <div
      style={style}
      className={`relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
    </div>
  );
}

export function ShimmerCircle({ className = "", style }) {
  return (
    <div
      style={style}
      className={`relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded-full ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
    </div>
  );
}

export function ShimmerText({ className = "", style }) {
  return (
    <div
      style={style}
      className={`relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
    </div>
  );
}