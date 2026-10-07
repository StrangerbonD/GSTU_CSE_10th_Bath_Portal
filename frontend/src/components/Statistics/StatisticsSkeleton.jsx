"use client";

import React from "react";

export default function StatisticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse select-none" aria-busy="true" aria-label="Loading batch statistics">
      {/* সামারি কার্ড গ্রিড স্কেলিটন */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5"
          >
            <div className="h-3 w-20 bg-slate-200/80 rounded" />
            <div className="h-8 w-16 bg-slate-300/80 rounded" />
            <div className="h-3 w-24 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* মেরিট লিডারবোর্ড টেবিল স্কেলিটন */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
          <div className="h-5 w-48 bg-slate-300/80 rounded" />
          <div className="h-6 w-24 bg-emerald-950/10 rounded-lg" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 text-center w-16">Rank</th>
                <th className="py-3 px-4 w-28">Student ID</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4 text-center w-24">CGPA</th>
                <th className="py-3 px-4 text-center w-28">Distinction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <tr key={i} className="hover:bg-slate-50/40">
                  <td className="py-3 px-4 text-center">
                    <div className="h-4 w-6 bg-slate-200/80 rounded mx-auto" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 w-20 bg-slate-200/80 rounded font-mono" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 w-36 bg-slate-200/80 rounded" />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="h-4 w-12 bg-slate-200/80 rounded mx-auto" />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="h-4 w-16 bg-slate-200/60 rounded mx-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
