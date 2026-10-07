"use client";

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { LineChart as ChartIcon } from "lucide-react";

export function GpaProgressionChart({ semesters = [] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeSemesters = (semesters || []).filter((s) => (s.gpa ?? 0) > 0);

  if (activeSemesters.length === 0) return null;

  // Calculate rolling CGPA for each semester
  let accumulatedPoints = 0;
  let accumulatedCredits = 0;

  const data = activeSemesters.map((sem) => {
    const semCredits = sem.creditOffered ?? sem.creditsOffered ?? 0;
    const semPoints =
      sem.pointSecured ??
      (semCredits * (sem.gpa ?? 0));

    accumulatedPoints += semPoints;
    accumulatedCredits += semCredits;
    const rollingCgpa =
      accumulatedCredits > 0
        ? Number((accumulatedPoints / accumulatedCredits).toFixed(3))
        : 0;

    return {
      semester: sem.semesterCode || `${sem.yearNumber}-${sem.semesterNumber}`,
      name: sem.semesterName,
      GPA: Number(Number(sem.gpa ?? 0).toFixed(3)),
      CGPA: rollingCgpa,
    };
  });

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 shadow-xs my-6 no-print min-h-[340px]">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-800 rounded">
            <ChartIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Academic Performance & GPA Progression
            </h3>
            <p className="text-xs text-slate-500">
              Semester GPA and Cumulative Grade Point Average trend
            </p>
          </div>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="semester" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis domain={[1.5, 4.0]} stroke="#64748b" fontSize={12} tickLine={false} tickCount={6} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#072342",
                  borderColor: "#1e3a8a",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "12px",
                }}
                itemStyle={{ color: "#ffffff" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
              <Line
                type="monotone"
                dataKey="GPA"
                name="Semester GPA"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 5, fill: "#3b82f6", strokeWidth: 2, stroke: "#ffffff" }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="CGPA"
                name="Cumulative CGPA"
                stroke="#eab308"
                strokeWidth={3}
                strokeDasharray="4 4"
                dot={{ r: 5, fill: "#eab308", strokeWidth: 2, stroke: "#ffffff" }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full bg-slate-50/50 rounded-lg animate-pulse" />
        )}
      </div>
    </div>
  );
}

export default GpaProgressionChart;
