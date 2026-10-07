"use client";

import React from "react";

export function FinalSummaryCard({ transcript }) {
  if (!transcript) return null;

  const cgpa = Number(transcript.cgpa ?? 0);

  // Compute academic standing if not provided
  let academicStanding = transcript.academicStanding;
  if (!academicStanding) {
    if (cgpa >= 3.75) {
      academicStanding = "First Class with Honours (Distinction)";
    } else if (cgpa >= 3.00) {
      academicStanding = "First Class";
    } else if (cgpa >= 2.25) {
      academicStanding = "Second Class";
    } else {
      academicStanding = "Pass Class";
    }
  }

  // Calculate credits
  const totalOffered =
    transcript.totalCreditsOffered ||
    transcript.totalCredits ||
    (transcript.semesters || []).reduce((acc, s) => acc + (s.creditOffered ?? s.creditsOffered ?? 0), 0) ||
    160;

  const totalEarned =
    transcript.totalCreditsEarned ??
    (transcript.semesters || []).reduce((acc, s) => acc + (s.creditSecured ?? s.creditsSecured ?? 0), 0);

  return (
    <div className="mt-4 pt-3 border-t-2 border-slate-800 print-avoid-break space-y-3">
      {/* Final CGPA Box */}
      <div className="bg-[#072342] text-white rounded-lg p-4 shadow-sm border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left space-y-1">
          <div className="text-xs uppercase tracking-wider text-blue-200">
            Cumulative Academic Record (Ordinance Sec. 8.2.3)
          </div>
          <div className="text-sm font-semibold text-slate-100 flex flex-wrap items-center gap-1.5 justify-center sm:justify-start">
            <span>Academic Standing:</span>
            <span
              className={`font-bold ${
                transcript.isDistinction ? "text-amber-300" : "text-slate-100"
              }`}
            >
              {academicStanding}
            </span>
          </div>
        </div>

        {/* Metric stats */}
        <div className="flex items-center gap-3 sm:gap-4 text-center">
          <div className="px-3 py-1.5 bg-white/10 rounded border border-white/10">
            <div className="text-[10px] uppercase tracking-wide text-blue-200">
              Total Credits
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-white">
              {totalOffered}
            </div>
          </div>

          <div className="px-3 py-1.5 bg-white/10 rounded border border-white/10">
            <div className="text-[10px] uppercase tracking-wide text-blue-200">
              Credits Earned
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-emerald-400">
              {totalEarned}
            </div>
          </div>

          <div className="px-4 py-1.5 bg-amber-500 rounded border border-amber-400 shadow-sm text-slate-950">
            <div className="text-[10px] uppercase tracking-wider font-extrabold">
              Final CGPA
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tracking-tight">
              {cgpa.toFixed(3)}
            </div>
          </div>
        </div>
      </div>

      {/* Ordinance Criteria Reference Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="font-bold text-slate-900 mr-1">Academic Ordinance:</span>
          <span className="bg-slate-200/80 text-slate-800 px-2 py-0.5 rounded font-mono text-[10px]">
            GPA (Sec. 8.2.1): Σ(C<sub>i</sub> · G<sub>i</sub>) / ΣC<sub>i</sub>
          </span>
          <span className="bg-slate-200/80 text-slate-800 px-2 py-0.5 rounded font-mono text-[10px]">
            YGPA (Sec. 8.2.2): Σ(C<sub>j</sub> · G<sub>j</sub>) / ΣC<sub>j</sub>
          </span>
          <span className="bg-slate-200/80 text-slate-800 px-2 py-0.5 rounded font-mono text-[10px]">
            CGPA (Sec. 8.2.3): Σ(C<sub>k</sub> · G<sub>k</sub>) / ΣC<sub>k</sub>
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 font-medium self-end md:self-auto">
          {transcript.isDistinction ? (
            <span className="text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded font-bold text-[11px] border border-emerald-300">
              Awarded with Distinction (Sec. 9.3)
            </span>
          ) : (
            <span className="text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200 text-[11px]">
              Degree Merit Position:{" "}
              <strong className="text-slate-900 font-mono font-bold">
                Position {transcript.meritRank || 29}
              </strong>{" "}
              (Sec. 8.3)
            </span>
          )}
        </div>
      </div>

      {/* Official Signatures Section */}
      <div className="mt-6 pt-6 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs text-slate-700">
        <div>
          <div className="border-b border-dashed border-slate-400 mb-1 h-8"></div>
          <span className="font-semibold text-slate-800">Prepared By</span>
          <p className="text-[10px] text-slate-500">Department of CSE</p>
        </div>

        <div>
          <div className="border-b border-dashed border-slate-400 mb-1 h-8"></div>
          <span className="font-semibold text-slate-800">Verified By</span>
          <p className="text-[10px] text-slate-500">
            Chairman, Examination Committee
          </p>
        </div>

        <div>
          <div className="border-b border-dashed border-slate-400 mb-1 h-8"></div>
          <span className="font-semibold text-slate-800">
            Controller of Examinations
          </span>
          <p className="text-[10px] text-slate-500">GSTU, Gopalganj</p>
        </div>
      </div>

      {/* Verification footer note */}
      <div className="mt-2 text-[10px] text-slate-400 text-center">
        <span>
          Official Digitally Signed Transcript — Gopalganj Science and Technology
          University (GSTU). Identifier: {transcript.studentId}
        </span>
      </div>
    </div>
  );
}

export default FinalSummaryCard;
