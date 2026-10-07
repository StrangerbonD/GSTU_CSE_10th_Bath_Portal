"use client";

import React from "react";

const getOrdinal = (n) => {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  if (n === 4) return "4th";
  return `${n}th`;
};

export function SemesterCard({ semester }) {
  if (!semester) return null;

  const courses = semester.courseResults || semester.courses || [];
  const hasResults = courses.length > 0;
  const creditOffered = semester.creditOffered ?? semester.creditsOffered ?? 0;
  const creditSecured = semester.creditSecured ?? semester.creditsSecured ?? 0;
  const gpa = Number(semester.gpa ?? 0);

  // Format title as "1st Year 1st Semester", "1st Year 2nd Semester", etc.
  const formattedName =
    semester.yearNumber && semester.semesterNumber
      ? `${getOrdinal(semester.yearNumber)} Year ${getOrdinal(semester.semesterNumber)} Semester`
      : semester.semesterName?.replace(
          /^(\d)\s*Year\s*(\d)\s*Semester$/i,
          (_, y, s) => `${getOrdinal(Number(y))} Year ${getOrdinal(Number(s))} Semester`
        ) || semester.semesterName;

  // Incomplete / failed courses detection
  const failedCourses = courses.filter(
    (c) => (c.letterGrade || c.gradeLetter) === "F" || (c.gradePoint ?? 0) === 0
  );
  const incompText =
    typeof semester.incompleteCourses === "string" && semester.incompleteCourses.trim()
      ? semester.incompleteCourses
      : failedCourses.length > 0
      ? failedCourses.map((c) => c.courseCode).join(", ")
      : null;

  return (
    <div className="semester-card border border-slate-300 rounded bg-white overflow-hidden shadow-xs flex flex-col justify-between text-xs">
      {/* Semester Header: 1-1 to 4-2 removed per instructions */}
      <div className="bg-slate-100/90 border-b border-slate-300 px-3 py-1.5 flex items-center justify-between">
        <h4 className="font-bold text-slate-800 text-[11px] sm:text-xs uppercase tracking-wider">
          {formattedName}
        </h4>
      </div>

      {/* Courses Table */}
      <div className="p-0 flex-grow">
        {hasResults ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] sm:text-[11px] text-slate-600 font-semibold uppercase">
                <th className="py-1 px-2 border-r border-slate-200 w-16">Code</th>
                <th className="py-1 px-2 border-r border-slate-200">Course Title</th>
                <th className="py-1 px-1.5 border-r border-slate-200 text-center w-8">Cr</th>
                <th className="py-1 px-1.5 border-r border-slate-200 text-center w-8">G</th>
                <th className="py-1 px-1.5 text-right w-10">GP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[10px] sm:text-[11px]">
              {courses.map((c) => {
                const grade = c.letterGrade || c.gradeLetter || "";
                const isFail = grade === "F" || (c.gradePoint ?? 0) === 0;
                const creditVal = c.credit ?? c.credits ?? 0;
                const gpVal = Number(c.gradePoint ?? 0);

                return (
                  <tr
                    key={c.courseCode}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isFail ? "bg-red-50/60 font-semibold text-red-900" : "text-slate-800"
                    }`}
                  >
                    <td className="py-1 px-2 border-r border-slate-200 font-mono font-medium text-slate-900">
                      {c.courseCode}
                    </td>
                    <td
                      className="py-1 px-2 border-r border-slate-200 truncate max-w-[170px] sm:max-w-[210px]"
                      title={c.courseTitle}
                    >
                      {c.courseTitle}
                    </td>
                    <td className="py-1 px-1.5 border-r border-slate-200 text-center font-mono">
                      {creditVal % 1 === 0 ? creditVal : creditVal.toFixed(1)}
                    </td>
                    <td
                      className={`py-1 px-1.5 border-r border-slate-200 text-center font-bold font-mono ${
                        isFail ? "text-red-600" : "text-slate-900"
                      }`}
                    >
                      {grade}
                    </td>
                    <td className="py-1 px-1.5 text-right font-mono font-semibold">
                      {gpVal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="py-8 text-center text-slate-400 italic text-[11px]">
            Result Awaiting / In Progress
          </div>
        )}
      </div>

      {/* Semester Summary Footer */}
      {hasResults && (
        <div className="bg-slate-50 border-t border-slate-300 px-3 py-1.5 flex flex-wrap items-center justify-between text-[11px] font-medium text-slate-700">
          <div className="flex items-center gap-3">
            <span>
              Offered: <strong className="font-mono text-slate-900">{creditOffered}</strong>
            </span>
            <span>
              Secured: <strong className="font-mono text-slate-900">{creditSecured}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {incompText && (
              <span
                className="text-[10px] text-red-700 font-semibold bg-red-100 px-1.5 py-0.5 rounded"
                title={`Incomplete: ${incompText}`}
              >
                Incomp: {incompText}
              </span>
            )}
            <span className="bg-slate-800 text-white font-mono font-bold px-2 py-0.5 rounded text-[11px] shadow-xs">
              GPA: {gpa.toFixed(3)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SemesterCard;
