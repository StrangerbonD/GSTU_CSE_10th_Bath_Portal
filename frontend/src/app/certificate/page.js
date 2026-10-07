"use client";

import { useEffect, useState } from "react";
import { portalService } from "@/services/portalService";
import ProvisionalCertificate from "@/components/Certificate/ProvisionalCertificate";
import CertificateSkeleton from "@/components/Certificate/CertificateSkeleton";

export default function CertificatePage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [studentId, setStudentId] = useState("20CSE016");
  const [searchInput, setSearchInput] = useState("20CSE016");
  const [certificateData, setCertificateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Certificate metadata customization state
  const [issueDate, setIssueDate] = useState("16-9-2026");
  const [examYear, setExamYear] = useState("2024");
  const [heldIn, setHeldIn] = useState("April, 2026");
  const [customSerial, setCustomSerial] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setMounted(true);
    let currentId = "20CSE016";
    let currentUser = null;
    try {
      const stored = localStorage.getItem("auth_user");
      if (stored) {
        currentUser = JSON.parse(stored);
        setUser(currentUser);
        if (currentUser?.studentId) currentId = currentUser.studentId;
      }
    } catch (e) {}

    setStudentId(currentId);
    setSearchInput(currentId);

    // Instant cache retrieval from memory/sessionStorage (zero flicker on F5 refresh)
    const cached = portalService.getCachedCertificate(currentId) || portalService.getCachedTranscript(currentId);
    if (cached) {
      setCertificateData(cached);
      setLoading(false);
    }

    fetchCertificateData(currentId, currentUser, Boolean(cached));
  }, []);

  const isAdmin = user?.role === "Admin";
  const myStudentId = user?.studentId || "";

  const fetchCertificateData = async (id, currentUser = user, hasCache = false) => {
    const isUserAdmin = currentUser?.role === "Admin";
    const myId = currentUser?.studentId;

    // Security Gate: Non-admin students CANNOT look up other students' certificates
    if (!isUserAdmin && myId && id.trim().toUpperCase() !== myId.trim().toUpperCase()) {
      setError(`Access Denied: You are authorized to view only your own confidential certificate (${myId}).`);
      setLoading(false);
      return;
    }

    if (!hasCache) {
      setLoading(true);
    }
    setError("");
    try {
      // Use protected getCertificate endpoint
      const data = await portalService.getCertificate(id);
      setCertificateData(data);
    } catch (err) {
      if (!hasCache) {
        setError(err.message || "Failed to load provisional certificate.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    const target = searchInput.trim().toUpperCase();

    // Security Gate: Non-admin students cannot search other IDs
    if (!isAdmin && myStudentId && target !== myStudentId.toUpperCase()) {
      setError(`Access Denied: You cannot view certificate for Student ID: ${target}. You are only authorized to view your own.`);
      return;
    }

    setStudentId(target);
    fetchCertificateData(target);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between font-sans text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900 print:min-h-0 print:h-auto print:bg-transparent print:block print:p-0 print:m-0">
      
      {/* মূল বডি: হেডার ও ফুটারের মাঝে ফুল পেজ সার্টিফিকেট */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 print:p-0 print:m-0 print:max-w-none print:w-full print:block">
        
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden print:border-none print:shadow-none print:rounded-none print:p-0 print:m-0 print:block print:bg-transparent">
          
          {/* হেডার টুলবার */}
          <div className="px-6 py-4 bg-[#0c2f54] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 print:hidden">
            <div>
              <h2 className="text-base font-bold">Provisional Certificate</h2>
            </div>

            {/* সার্চ বার - কেবল এডমিনের জন্য উন্মুক্ত, সাধারণ স্টুডেন্টের জন্য লুকায়িত */}
            {mounted && isAdmin && (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                  placeholder="Student ID (Admin View)"
                  className="px-3.5 py-1.5 bg-white/15 border border-white/20 text-white placeholder-sky-200 text-xs rounded-xl outline-none focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 font-mono tracking-wider transition w-44"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-60"
                >
                  Find
                </button>
              </form>
            )}

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                  showSettings
                    ? "bg-amber-400 text-slate-950 border-amber-300"
                    : "bg-white/10 hover:bg-white/20 text-white border-white/15"
                }`}
              >
                Customize
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 border border-white/15"
              >
                Print Certificate
              </button>
            </div>
          </div>

          {/* কাস্টমাইজেশন প্যানেল */}
          {showSettings && (
            <div className="px-6 py-4 bg-amber-50/90 border-b border-amber-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs print:hidden">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Date of Issue</label>
                <input
                  type="text"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  placeholder="e.g. 16-9-2026"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Examination of (Year)</label>
                <input
                  type="text"
                  value={examYear}
                  onChange={(e) => setExamYear(e.target.value)}
                  placeholder="e.g. 2024"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Held In (Month Year)</label>
                <input
                  type="text"
                  value={heldIn}
                  onChange={(e) => setHeldIn(e.target.value)}
                  placeholder="e.g. April, 2026"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Custom Serial No (Optional)</label>
                <input
                  type="text"
                  value={customSerial}
                  onChange={(e) => setCustomSerial(e.target.value)}
                  placeholder="e.g. CSE-002009034"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>
            </div>
          )}

          {/* সার্টিফিকেট বডি */}
          <div className="p-4 sm:p-8 bg-[#f8fafc] flex justify-center min-h-[920px] print:p-0 print:m-0 print:bg-transparent print:min-h-0 print:h-auto print:block">
            {loading && !certificateData && (
              <CertificateSkeleton />
            )}

            {error && !loading && (
              <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center text-red-700 font-sans my-8 w-full max-w-xl">
                <p className="text-base font-bold mb-1">Security Notice</p>
                <p className="text-sm">{error}</p>
                {myStudentId && (
                  <button
                    onClick={() => {
                      setStudentId(myStudentId);
                      setSearchInput(myStudentId);
                      fetchCertificateData(myStudentId);
                    }}
                    className="mt-3 px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition"
                  >
                    View My Certificate ({myStudentId})
                  </button>
                )}
              </div>
            )}

            {certificateData && (
              <ProvisionalCertificate
                certificateData={certificateData}
                issueDate={issueDate}
                examYear={examYear}
                heldIn={heldIn}
                serialNo={customSerial || undefined}
              />
            )}
          </div>

        </div>

      </main>

      {/* ফুটার */}
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
