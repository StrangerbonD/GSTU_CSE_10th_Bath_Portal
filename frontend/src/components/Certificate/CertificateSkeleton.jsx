"use client";

import React from "react";

export default function CertificateSkeleton() {
  return (
    <div className="w-full flex justify-center py-2 sm:py-6 animate-pulse select-none">
      <div
        style={{
          width: "800px",
          height: "1131px",
        }}
        className="certificate-sheet relative bg-[#FAF8F1] border border-amber-900/10 shadow-xl shrink-0 p-[56px] pt-[48px] flex flex-col justify-between"
      >
        {/* Header Skeleton */}
        <div className="flex flex-col items-center">
          {/* University Title Placeholder */}
          <div className="h-9 w-3/4 bg-slate-300/60 rounded-md mb-4" />
          
          {/* Emblem Placeholder */}
          <div className="w-[72px] h-[72px] bg-slate-200/80 rounded-md my-2 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-slate-300/70 border-t-transparent rounded-full animate-spin" />
          </div>

          {/* Subtitle Placeholder */}
          <div className="h-4 w-1/2 bg-slate-300/50 rounded mt-3 mb-2" />
          <div className="h-7 w-2/3 bg-slate-400/40 rounded mt-2" />
        </div>

        {/* Certificate Body Lines Skeleton */}
        <div className="space-y-6 my-auto px-6">
          <div className="h-4 w-full bg-slate-300/40 rounded" />
          <div className="h-6 w-3/4 mx-auto bg-slate-400/50 rounded" />
          <div className="h-4 w-5/6 mx-auto bg-slate-300/40 rounded" />
          <div className="h-5 w-2/3 mx-auto bg-slate-400/40 rounded" />
          <div className="h-4 w-full bg-slate-300/40 rounded" />
          <div className="h-4 w-4/5 mx-auto bg-slate-300/40 rounded" />
        </div>

        {/* Footer / Signatures Skeleton */}
        <div className="flex justify-between items-end pt-12 border-t border-slate-200/60">
          <div className="space-y-2">
            <div className="h-3 w-28 bg-slate-300/50 rounded" />
            <div className="h-4 w-36 bg-slate-300/40 rounded" />
          </div>
          <div className="space-y-2 text-right">
            <div className="h-8 w-32 bg-slate-300/50 rounded ml-auto" />
            <div className="h-3 w-36 bg-slate-300/40 rounded ml-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
