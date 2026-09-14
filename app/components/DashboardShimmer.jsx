"use client";

import { ShimmerBox, ShimmerText } from "./Shimmer";

export default function DashboardShimmer() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-full mx-auto space-y-4">

        {/* Month navigation bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <ShimmerBox className="h-10 w-28 rounded-lg" />
            <ShimmerBox className="h-6 w-40" />
            <div className="flex gap-2">
              <ShimmerBox className="h-10 w-32 rounded-lg" />
              <ShimmerBox className="h-10 w-24 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Activity table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="space-y-3">
            {/* Header row */}
            <div className="flex gap-2">
              <ShimmerBox className="h-8 w-40" />
              {Array.from({ length: 15 }).map((_, i) => (
                <ShimmerBox key={i} className="h-8 w-8" />
              ))}
            </div>
            {/* Activity rows */}
            {Array.from({ length: 8 }).map((_, row) => (
              <div key={row} className="flex gap-2 items-center">
                <ShimmerBox className="h-6 w-40" />
                {Array.from({ length: 15 }).map((_, i) => (
                  <ShimmerBox key={i} className="h-6 w-8" />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Weekly progress cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border border-gray-200 dark:border-gray-700 space-y-2"
            >
              <ShimmerBox className="h-3 w-16 mx-auto" />
              <ShimmerBox className="h-3 w-20 mx-auto" />
              <ShimmerBox className="h-6 w-12 mx-auto" />
              <ShimmerBox className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>

        {/* Monthly consistency */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <ShimmerBox className="h-12 w-20" />
            <div className="flex-1 space-y-2">
              <ShimmerBox className="h-3 w-full rounded-full" />
              <ShimmerBox className="h-3 w-2/3" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}