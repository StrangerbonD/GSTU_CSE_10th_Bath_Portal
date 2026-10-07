"use client";

import { useEffect, useState } from "react";
import { portalService } from "@/services/portalService";
import StatisticsSkeleton from "@/components/Statistics/StatisticsSkeleton";

export default function StatisticsModal({ isOpen, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      const cached = portalService.getCachedStatistics();
      if (cached) {
        setStats(cached);
        setLoading(false);
      }
      loadStats(Boolean(cached));
    }
  }, [isOpen]);

  const loadStats = async (hasCache = false) => {
    if (!hasCache) setLoading(true);
    setError("");
    try {
      const data = await portalService.getStatistics();
      setStats(data);
    } catch (err) {
      if (!stats && !hasCache) setError(err.message || "Failed to load statistics.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto print:p-0">
      {/* ব্যাকড্রপ */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
        <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all flex flex-col max-h-[92vh]">
          
          {/* হেডার */}
          <div className="px-6 py-4 bg-[#0e3b2e] text-white flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-base font-bold">Batch Statistics & Leaderboard</h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadStats}
                disabled={loading}
                className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 border border-white/15 disabled:opacity-60"
              >
                <span>Refresh</span>
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg cursor-pointer"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* বডি */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 font-sans bg-slate-50/50 min-h-[400px]">
            {loading && !stats && (
              <StatisticsSkeleton />
            )}

            {error && !stats && (
              <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center text-red-700 my-8">
                <p className="text-base font-bold mb-1">Notice</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {stats && (
              <div className="space-y-6">
                
                {/* সামারি কার্ড গ্রিড */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-xs text-slate-500 font-semibold block uppercase">Total Students</span>
                    <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.totalStudents}</span>
                    <span className="text-[10px] text-emerald-600 font-bold">Active in DB</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-xs text-slate-500 font-semibold block uppercase">Highest CGPA</span>
                    <span className="text-2xl font-black text-emerald-700 mt-1 block">{stats.highestCGPA?.toFixed(2)}</span>
                    <span className="text-[10px] text-emerald-600 font-bold">Top of Batch</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-xs text-slate-500 font-semibold block uppercase">Batch Average</span>
                    <span className="text-2xl font-black text-blue-700 mt-1 block">{stats.averageCGPA?.toFixed(2)}</span>
                    <span className="text-[10px] text-blue-600 font-bold">Mean CGPA</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-xs text-slate-500 font-semibold block uppercase">Distinction</span>
                    <span className="text-2xl font-black text-amber-600 mt-1 block">{stats.distinctionCount}</span>
                    <span className="text-[10px] text-amber-600 font-bold">Honours Achievers</span>
                  </div>
                </div>

                {/* মেরিট লিডারবোর্ড */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-5 py-4 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm sm:text-base">Batch Merit Leaderboard</h4>
                    </div>
                    <span className="px-3 py-1 bg-[#0e3b2e] text-white text-xs font-bold rounded-lg shadow-xs">
                      Ranked Top
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4 text-center">Rank</th>
                          <th className="py-3 px-4">Student ID</th>
                          <th className="py-3 px-4">Student Name</th>
                          <th className="py-3 px-4 text-center">CGPA</th>
                          <th className="py-3 px-4 text-center">Distinction</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {stats.leaderboard?.map((student) => (
                          <tr key={student.studentId} className="hover:bg-emerald-50/40 transition">
                            <td className="py-3 px-4 text-center font-bold text-slate-800 font-mono">
                              {student.rank}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">{student.studentId}</td>
                            <td className="py-3 px-4 font-semibold text-slate-800">{student.studentName}</td>
                            <td className="py-3 px-4 text-center font-bold text-emerald-800 font-mono text-base">{student.cgpa?.toFixed(2)}</td>
                            <td className="py-3 px-4 text-center">
                              {student.isDistinction ? (
                                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[11px] font-bold">
                                  Distinction
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
