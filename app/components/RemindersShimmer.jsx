"use client";

import { ShimmerBox, ShimmerCircle } from "./Shimmer";

export default function RemindersShimmer() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <ShimmerBox className="h-8 w-40" />
            <ShimmerBox className="h-4 w-64" />
          </div>
          <ShimmerBox className="h-10 w-36 rounded-lg" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <ShimmerBox className="h-10 w-24 rounded-lg" />
          <ShimmerBox className="h-10 w-28 rounded-lg" />
          <ShimmerBox className="h-10 w-20 rounded-lg" />
        </div>

        {/* Reminder cards */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <ShimmerCircle className="w-10 h-10" />
                  <div className="flex-1 space-y-2">
                    <ShimmerBox className="h-4 w-48" />
                    <ShimmerBox className="h-3 w-72" />
                    <div className="flex gap-3">
                      <ShimmerBox className="h-3 w-20" />
                      <ShimmerBox className="h-3 w-24" />
                      <ShimmerBox className="h-3 w-16" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <ShimmerBox className="w-8 h-8 rounded-lg" />
                  <ShimmerBox className="w-8 h-8 rounded-lg" />
                  <ShimmerBox className="w-8 h-8 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}