"use client";

import { useEffect, useState } from "react";
import { portalService } from "@/services/portalService";
import AcademicTranscript from "@/components/Transcript";

export default function TranscriptModal({ isOpen, onClose, studentId: propStudentId }) {
  const [studentId, setStudentId] = useState(propStudentId || "20CSE016");
  const [searchInput, setSearchInput] = useState(propStudentId || "20CSE016");
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      let currentId = propStudentId || "20CSE016";
      if (!propStudentId) {
        const stored = localStorage.getItem("auth_user");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.studentId) currentId = parsed.studentId;
          } catch (e) {}
        }
      }
      setStudentId(currentId);
      setSearchInput(currentId);
      fetchTranscriptData(currentId);
    }
  }, [isOpen, propStudentId]);

  const fetchTranscriptData = async (id) => {
    setLoading(true);
    setError("");
    try {
      const data = await portalService.getTranscript(id);
      setTranscript(data);
    } catch (err) {
      setError(err.message || "Failed to load academic transcript.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setStudentId(searchInput.trim());
    fetchTranscriptData(searchInput.trim());
  };

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto print:p-0">
      {/* ব্যাকড্রপ */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity print:hidden"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-6 print:p-0">
        <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
          
          {/* ১. অ্যাকশন বার (প্রিন্ট ও ক্লোজ বাটন) */}
          <div className="px-6 py-4 bg-[#0c2f54] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 print:hidden">
            <div>
              <h3 className="text-base font-bold">Academic Transcript</h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 border border-white/15"
              >
                <span>Print</span>
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

          {/* ২. ট্রান্সক্রিপ্ট ডকুমেন্ট বডি (স্ক্রোলযোগ্য) */}
          <div className="p-4 sm:p-8 overflow-y-auto flex-1 font-sans print:overflow-visible print:p-2 bg-white text-slate-900">
            
            {loading && (
              <div className="py-20 text-center">
                <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="font-sans text-sm font-semibold text-slate-600">Fetching transcript from PostgreSQL...</p>
              </div>
            )}

            {error && !loading && (
              <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center text-red-700 font-sans my-8">
                <p className="text-base font-bold mb-1">⚠️ Record Not Found</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {!loading && !error && transcript && (
              <AcademicTranscript transcript={transcript} />
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
