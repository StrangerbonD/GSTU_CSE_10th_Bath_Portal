"use client";

import { useEffect, useState } from "react";
import { portalService } from "@/services/portalService";
import AcademicTranscript from "@/components/Transcript";
import TranscriptSkeleton from "@/components/Transcript/TranscriptSkeleton";
import { Printer } from "lucide-react";

export default function TranscriptPage() {
  const [mounted, setMounted] = useState(false);
  const [studentId, setStudentId] = useState("20CSE016");
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    let activeId = "20CSE016";
    try {
      const stored = localStorage.getItem("auth_user");
      if (stored) {
        const user = JSON.parse(stored);
        if (user?.studentId) {
          activeId = user.studentId;
        }
      }
    } catch (e) {
      console.warn("Failed reading auth_user from localStorage", e);
    }

    setStudentId(activeId);

    // Instant cache retrieval from sessionStorage/memory (zero flicker on F5 refresh)
    const cached = portalService.getCachedTranscript(activeId);
    if (cached) {
      setTranscript(cached);
      setLoading(false);
    }

    fetchTranscriptData(activeId, Boolean(cached));
  }, []);

  const fetchTranscriptData = async (id, hasCache = false) => {
    if (!hasCache) {
      setLoading(true);
    }
    setError("");
    try {
      const data = await portalService.getTranscript(id);
      setTranscript(data);
    } catch (err) {
      if (!hasCache) {
        setError(err.message || "Failed to load academic transcript.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#edf0f5] flex flex-col justify-between font-sans text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <main className="max-w-5xl mx-auto px-2 sm:px-6 py-6 sm:py-8 w-full flex-1 print:p-0 print:max-w-none">
        {/* Simple Print Action (Screen only, hidden in print) */}
        <div className="no-print flex items-center justify-end mb-4">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Transcript</span>
          </button>
        </div>

        {/* Loading State / Document Skeleton (Preserves exact layout dimensions, zero flicker) */}
        {loading && !transcript && (
          <TranscriptSkeleton />
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center text-red-700 font-sans my-8">
            <p className="text-base font-bold mb-1">Notice</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Transcript Document */}
        {transcript && (
          <AcademicTranscript transcript={transcript} />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#0f172a] text-slate-400 py-6 text-center text-sm font-medium border-t border-slate-800 mt-12 print:hidden">
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
