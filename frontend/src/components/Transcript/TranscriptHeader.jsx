"use client";

import React from "react";

export function TranscriptHeader({ transcript }) {
  if (!transcript) return null;

  return (
    <div className="border-b-2 border-slate-800 pb-4 mb-4">
      {/* University Official Header */}
      <div className="text-center mb-4">
        {/* Monogram / Emblem: Natural rectangular shape, NOT rounded per instructions */}
        <div className="flex items-center justify-center mb-2">
          <img
            src="/images/branding/gstu_logo.jpeg"
            alt="GSTU Official Logo"
            className="h-16 sm:h-20 w-auto object-contain"
          />
        </div>

        <h1 className="text-lg sm:text-2xl font-bold uppercase tracking-wider text-slate-900 font-serif">
          Gopalganj Science and Technology University
        </h1>
        <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-slate-700">
          Faculty of Engineering
        </h2>
        <h3 className="text-xs sm:text-sm font-medium text-slate-800">
          Department of Computer Science and Engineering
        </h3>

        <div className="inline-block mt-2 px-4 py-1 border border-slate-900 bg-slate-100 rounded-sm">
          <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-900">
            Official Academic Transcript
          </span>
        </div>
      </div>

      {/* Student Meta Details Box (Registration No removed; Merit Rank as Position 29) */}
      <div className="bg-slate-50/80 border border-slate-300 rounded p-3 text-xs sm:text-sm shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
          <div className="flex">
            <span className="w-36 font-semibold text-slate-700">Student ID:</span>
            <span className="font-bold text-slate-900 tracking-wide font-mono text-sm sm:text-base text-blue-900">
              {transcript.studentId}
            </span>
          </div>

          <div className="flex">
            <span className="w-36 font-semibold text-slate-700">Student Name:</span>
            <span className="font-bold text-slate-900">
              {transcript.studentName}
            </span>
          </div>

          <div className="flex">
            <span className="w-36 font-semibold text-slate-700">Academic Session:</span>
            <span className="font-medium text-slate-900">
              {transcript.session}
            </span>
          </div>

          <div className="flex">
            <span className="w-36 font-semibold text-slate-700">Degree Conferred:</span>
            <span className="font-medium text-slate-900">
              {transcript.degree || "B.Sc. Engineering in Computer Science and Engineering"}
            </span>
          </div>

          <div className="flex items-center">
            <span className="w-36 font-semibold text-slate-700">Batch Merit Rank:</span>
            <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300 text-xs">
              Position {transcript.meritRank || 29}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TranscriptHeader;
