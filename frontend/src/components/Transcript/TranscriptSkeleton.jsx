"use client";

import React from "react";

export default function TranscriptSkeleton() {
  return (
    <div className="w-full space-y-6 text-slate-900 font-sans animate-pulse select-none">
      {/* Main Transcript Sheet Skeleton */}
      <div className="bg-white border border-slate-300 shadow-md rounded-lg p-4 sm:p-8 max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="border-b-2 border-slate-800/20 pb-4 mb-4 text-center">
          {/* Logo Placeholder */}
          <div className="h-16 w-24 bg-slate-200/80 rounded mx-auto mb-3" />
          <div className="h-6 w-3/4 max-w-md bg-slate-300/70 rounded mx-auto mb-2" />
          <div className="h-4 w-1/2 max-w-xs bg-slate-200/80 rounded mx-auto mb-1" />
          <div className="h-4 w-2/3 max-w-sm bg-slate-200/80 rounded mx-auto mb-3" />
          <div className="h-6 w-48 bg-slate-200/90 rounded mx-auto mb-4" />

          {/* Student Meta Details Box */}
          <div className="bg-slate-50 border border-slate-200 rounded p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="h-4 bg-slate-200/80 rounded w-4/5" />
              <div className="h-4 bg-slate-200/80 rounded w-4/5" />
              <div className="h-4 bg-slate-200/80 rounded w-3/4" />
              <div className="h-4 bg-slate-200/80 rounded w-5/6" />
              <div className="h-4 bg-slate-200/80 rounded w-1/2" />
            </div>
          </div>
        </div>

        {/* 8-Semester Grid Placeholders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div
              key={item}
              className="border border-slate-200 rounded p-3 bg-slate-50/50 space-y-2.5"
            >
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <div className="h-4 w-36 bg-slate-300/70 rounded" />
                <div className="h-4 w-16 bg-slate-200/80 rounded" />
              </div>
              <div className="space-y-1.5 py-1">
                <div className="h-3 w-full bg-slate-200/60 rounded" />
                <div className="h-3 w-full bg-slate-200/60 rounded" />
                <div className="h-3 w-4/5 bg-slate-200/60 rounded" />
                <div className="h-3 w-5/6 bg-slate-200/60 rounded" />
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between">
                <div className="h-3 w-24 bg-slate-200/70 rounded" />
                <div className="h-3 w-16 bg-slate-300/70 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Final Summary Card Placeholder */}
        <div className="mt-6 border-t-2 border-slate-800/20 pt-4 bg-slate-50 rounded p-4 flex justify-between items-center">
          <div className="h-6 w-48 bg-slate-300/80 rounded" />
          <div className="h-8 w-32 bg-slate-300/90 rounded" />
        </div>
      </div>

      {/* GPA Progression Chart Placeholder */}
      <div className="max-w-5xl mx-auto bg-white border border-slate-200 rounded-lg p-6 h-72">
        <div className="h-5 w-64 bg-slate-200 rounded mb-4" />
        <div className="h-48 w-full bg-slate-100 rounded" />
      </div>
    </div>
  );
}
