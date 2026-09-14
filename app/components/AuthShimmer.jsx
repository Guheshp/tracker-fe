"use client";

import { ShimmerBox, ShimmerCircle } from "./Shimmer";

export default function AppShimmer() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col">

      {/* Top Navbar skeleton */}
      <div className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6 gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <ShimmerBox className="w-9 h-9 rounded-xl" />
          <div className="hidden sm:block space-y-1.5">
            <ShimmerBox className="h-3 w-28" />
            <ShimmerBox className="h-2 w-20" />
          </div>
        </div>
        <div className="hidden md:block flex-1 max-w-md">
          <ShimmerBox className="h-10 w-full rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <ShimmerBox className="w-9 h-9 rounded-lg" />
          <ShimmerCircle className="w-8 h-8" />
        </div>
      </div>

      {/* Body: sidebar + main */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar skeleton (desktop) */}
        <div className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-3 gap-2">
          <ShimmerBox className="h-3 w-14 mt-3 mb-2" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <ShimmerBox className="w-5 h-5 rounded-md" />
              <ShimmerBox className="h-4 flex-1" />
            </div>
          ))}
        </div>

        {/* Main content skeleton */}
        <main className="flex-1 p-2 lg:p-2 overflow-hidden">

          {/* Header row */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
            <div className="flex items-center justify-between gap-4">
              <ShimmerBox className="h-9 w-28 rounded-lg" />
              <ShimmerBox className="h-6 w-40" />
              <ShimmerBox className="h-9 w-40 rounded-lg" />
            </div>
          </div>

          {/* Table card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <ShimmerBox className="h-8 w-32" />
                {Array.from({ length: 14 }).map((_, i) => (
                  <ShimmerBox key={i} className="h-8 w-7" />
                ))}
              </div>
              {Array.from({ length: 8 }).map((_, row) => (
                <div key={row} className="flex gap-2 items-center">
                  <ShimmerBox className="h-6 w-32" />
                  {Array.from({ length: 14 }).map((_, i) => (
                    <ShimmerBox key={i} className="h-6 w-7" />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2"
              >
                <ShimmerBox className="h-3 w-16 mx-auto" />
                <ShimmerBox className="h-6 w-12 mx-auto" />
                <ShimmerBox className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-4">
              <ShimmerBox className="h-10 w-16" />
              <div className="flex-1 space-y-2">
                <ShimmerBox className="h-3 w-full rounded-full" />
                <ShimmerBox className="h-3 w-2/3" />
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}