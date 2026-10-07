"use client";

import React from "react";
import { SemesterCard } from "./SemesterCard";

export function SemesterGrid({ semesters = [], yearlyResults = [], meritRank = 29 }) {
  const years = [1, 2, 3, 4];
  const yearNames = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

  return (
    <div className="space-y-4 my-4">
      {years.map((yearNum) => {
        const yearSemesters = (semesters || []).filter((s) => s.yearNumber === yearNum);
        const passedYearResult = (yearlyResults || []).find((y) => y.yearNumber === yearNum);

        // Compute fallback year totals if needed
        let computedOffered = 0;
        let computedSecured = 0;
        let computedPoints = 0;

        yearSemesters.forEach((sem) => {
          const off = sem.creditOffered ?? sem.creditsOffered ?? 0;
          const sec = sem.creditSecured ?? sem.creditsSecured ?? 0;
          computedOffered += off;
          computedSecured += sec;
          computedPoints += off * (sem.gpa ?? 0);
        });

        const computedYgpa = computedOffered > 0 ? computedPoints / computedOffered : 0;

        const yearResult = passedYearResult || {
          yearNumber: yearNum,
          yearName: yearNames[yearNum - 1] || `Year ${yearNum}`,
          totalCreditsOffered: computedOffered,
          totalCreditsSecured: computedSecured,
          ygpa: computedYgpa,
          yearlyMeritRank: 0,
        };

        const yearName = yearResult.yearName || yearNames[yearNum - 1] || `Year ${yearNum}`;
        const hasOffered = (yearResult.totalCreditsOffered ?? computedOffered) > 0;

        // Ensure Yearly Merit Position is always present
        const yearlyPosition =
          passedYearResult?.yearlyMeritRank && passedYearResult.yearlyMeritRank > 0
            ? passedYearResult.yearlyMeritRank
            : meritRank || 29;

        return (
          <div
            key={yearNum}
            className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50 space-y-2.5"
          >
            {/* Year Header Banner */}
            <div className="flex items-center justify-between px-2 py-1 bg-[#0c3b6d] text-white rounded text-xs font-bold uppercase tracking-wider">
              <span>{yearName} Academic Record</span>
              <span className="text-[10px] font-mono text-blue-200">
                Ordinance Sec. 8.2.2
              </span>
            </div>

            {/* 2-Column Semesters Layout */}
            <div className="semester-grid grid grid-cols-1 lg:grid-cols-2 gap-3">
              {yearSemesters.map((sem, sIdx) => (
                <SemesterCard
                  key={sem.semesterCode || `${sem.yearNumber}-${sem.semesterNumber}-${sIdx}`}
                  semester={sem}
                />
              ))}
            </div>

            {/* Yearly Summary Bar: YGPA & Yearly Merit Position */}
            {hasOffered && (
              <div className="bg-amber-50/90 border border-amber-300/80 rounded px-3 py-2 flex flex-wrap items-center justify-between text-xs text-amber-950 font-medium">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-800">
                    {yearName} Total Credits:{" "}
                    <strong className="font-mono text-slate-950">
                      {yearResult.totalCreditsSecured} / {yearResult.totalCreditsOffered}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded border border-amber-300 text-[11px]">
                    {yearName} Merit Position: <strong>Position {yearlyPosition}</strong>
                  </span>

                  <span className="bg-[#072342] text-amber-300 font-mono font-black px-2.5 py-1 rounded text-xs shadow-2xs">
                    YGPA: {Number(yearResult.ygpa || 0).toFixed(3)}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default SemesterGrid;
