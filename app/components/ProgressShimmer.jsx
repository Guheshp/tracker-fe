"use client";

import { ShimmerBox } from "./Shimmer";

export default function ProgressShimmer() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="space-y-2">
          <ShimmerBox className="h-8 w-56" />
          <ShimmerBox className="h-4 w-80" />
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 space-y-3"
            >
              <ShimmerBox className="h-3 w-24" />
              <ShimmerBox className="h-8 w-16" />
              <ShimmerBox className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <ShimmerBox className="h-5 w-40" />
          <div className="flex items-end gap-2 h-48">
            {Array.from({ length: 12 }).map((_, i) => (
              <ShimmerBox
                key={i}
                className="flex-1"
                style={{ height: `${30 + Math.random() * 70}%` }}
              />
            ))}
          </div>
        </div>

        {/* Heatmap grid */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <ShimmerBox className="h-5 w-32" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <ShimmerBox key={i} className="aspect-square rounded" />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}