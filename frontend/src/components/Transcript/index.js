"use client";

import React from "react";
import { TranscriptHeader } from "./TranscriptHeader";
import { SemesterGrid } from "./SemesterGrid";
import { SemesterCard } from "./SemesterCard";
import { FinalSummaryCard } from "./FinalSummaryCard";
import { GpaProgressionChart } from "./GpaProgressionChart";

export {
  TranscriptHeader,
  SemesterGrid,
  SemesterCard,
  FinalSummaryCard,
  GpaProgressionChart,
};

export default function AcademicTranscript({ transcript }) {
  if (!transcript) return null;

  return (
    <div className="w-full space-y-6 text-slate-900 font-sans selection:bg-sky-100">
      {/* Main Transcript Document Sheet */}
      <div className="transcript-sheet bg-white border border-slate-300 shadow-md rounded-lg p-4 sm:p-8 max-w-5xl mx-auto">
        <TranscriptHeader transcript={transcript} />
        <SemesterGrid
          semesters={transcript.semesters}
          yearlyResults={transcript.yearlyResults}
          meritRank={transcript.meritRank}
        />
        <FinalSummaryCard transcript={transcript} />
      </div>

      {/* GPA Progression Chart (Hidden in Print) */}
      <div className="max-w-5xl mx-auto">
        <GpaProgressionChart semesters={transcript.semesters} />
      </div>
    </div>
  );
}
