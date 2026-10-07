"use client";

import { useEffect, useState } from "react";
import { portalService } from "@/services/portalService";
import StatisticsSkeleton from "@/components/Statistics/StatisticsSkeleton";

export default function StatisticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Instant cache retrieval from memory/sessionStorage (zero flicker on F5 refresh)
    const cached = portalService.getCachedStatistics();
    if (cached) {
      setStats(cached);
      setLoading(false);
    }
    // Background revalidation
    fetchData(Boolean(cached));
  }, []);

  const fetchData = async (hasCache = false) => {
    if (!hasCache) {
      setLoading(true);
    }
    setError("");
    try {
      const data = await portalService.getStatistics(false);
      setStats(data);
    } catch (err) {
      if (!hasCache) {
        setError(err.message || "Failed to load batch statistics.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await portalService.getStatistics(true);
      setStats(data);
      setError("");
    } catch (err) {
      if (!stats) {
        setError(err.message || "Failed to refresh batch statistics.");
      }
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between font-sans text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* মূল বডি: হেডার ও ফুটারের মাঝে ফুল পেজ স্ট্যাটিস্টিক্স */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden">
          
          {/* হেডার বার */}
          <div className="px-6 py-5 bg-[#0e3b2e] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Batch Statistics & Merit Analytics</h2>
            </div>

            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={refreshing || (loading && !stats)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 border border-white/15 disabled:opacity-60 self-start sm:self-auto"
            >
              {refreshing ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <span>Refresh Data</span>
              )}
            </button>
          </div>

          {/* কনটেন্ট বডি */}
          <div className="p-6 sm:p-8 font-sans bg-slate-50/50 min-h-[480px]">
            {/* Loading Skeleton: Exact layout match, zero shift or flicker on refresh */}
            {loading && !stats && (
              <StatisticsSkeleton />
            )}

            {/* Error UI when no data is available */}
            {error && !stats && (
              <div className="p-8 bg-white border border-slate-200/90 rounded-3xl text-center shadow-xs my-8 max-w-lg mx-auto">
                <div className="w-12 h-12 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center text-rose-700 mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Unable to Load Statistics</h3>
                <p className="text-sm text-slate-600 mb-6">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchData(false)}
                  className="inline-block px-5 py-2.5 bg-[#0e3b2e] hover:bg-[#134e3f] text-white text-sm font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Content: Always persists if stats exists, preventing flicker */}
            {stats && (
              <div className="space-y-6">
                
                {/* সামারি কার্ড গ্রিড */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                    <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Total Students</span>
                    <span className="text-3xl font-black text-slate-900 mt-1 block">{stats.totalStudents}</span>
                    <span className="text-[11px] text-emerald-700 font-bold mt-0.5 block">CSE 10th Batch</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                    <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Highest CGPA</span>
                    <span className="text-3xl font-black text-emerald-700 mt-1 block">{stats.highestCGPA?.toFixed(2)}</span>
                    <span className="text-[11px] text-emerald-700 font-bold mt-0.5 block">Top of Batch</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                    <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Batch Average</span>
                    <span className="text-3xl font-black text-blue-700 mt-1 block">{stats.averageCGPA?.toFixed(2)}</span>
                    <span className="text-[11px] text-blue-600 font-bold mt-0.5 block">Mean CGPA</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                    <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Distinction</span>
                    <span className="text-3xl font-black text-amber-600 mt-1 block">{stats.distinctionCount}</span>
                    <span className="text-[11px] text-amber-700 font-bold mt-0.5 block">Honours Achievers</span>
                  </div>
                </div>

                {/* মেরিট লিডারবোর্ড */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                  <div className="px-6 py-4 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-slate-900 text-base">Batch Merit Leaderboard</h3>
                    </div>
                    <span className="px-3.5 py-1 bg-[#0e3b2e] text-white text-xs font-bold rounded-lg shadow-xs">
                      Official Rank
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

      </main>

      {/* ফুটার */}
      <footer className="w-full bg-[#0f172a] text-slate-400 py-6 text-center text-sm font-medium border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-slate-300 font-semibold">
            GSTU CSE 10<sup>th</sup> Batch Portal
          </p>
          <p className="text-slate-400 text-xs sm:text-sm">
            @strangerbond . All right reserved
          </p>
        </div>
      </footer>

    </div>
  );
}
