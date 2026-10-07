"use client";

import { useEffect, useState } from "react";
import { portalService } from "@/services/portalService";
import ProvisionalCertificate from "@/components/Certificate/ProvisionalCertificate";

export default function CertificateModal({ isOpen, onClose, studentId: propStudentId }) {
  const [user, setUser] = useState(null);
  const [studentId, setStudentId] = useState(propStudentId || "20CSE016");
  const [searchInput, setSearchInput] = useState(propStudentId || "20CSE016");
  const [certificateData, setCertificateData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      let currentId = propStudentId || "20CSE016";
      let currentUser = null;
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("auth_user");
        if (stored) {
          try {
            currentUser = JSON.parse(stored);
            setUser(currentUser);
            // Non-admin is strictly bound to their own studentId
            if (currentUser.role !== "Admin" && currentUser.studentId) {
              currentId = currentUser.studentId;
            }
          } catch (e) {}
        }
      }
      setStudentId(currentId);
      setSearchInput(currentId);
      fetchCertificateData(currentId, currentUser);
    }
  }, [isOpen, propStudentId]);

  const isAdmin = user?.role === "Admin";
  const myStudentId = user?.studentId || "";

  const fetchCertificateData = async (id, currentUser = user) => {
    const isUserAdmin = currentUser?.role === "Admin";
    const myId = currentUser?.studentId;

    // Security Gate: Non-admin students CANNOT look up other students' certificates
    if (!isUserAdmin && myId && id.trim().toUpperCase() !== myId.trim().toUpperCase()) {
      setError(`Access Denied: You are authorized to view only your own confidential certificate (${myId}).`);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await portalService.getCertificate(id);
      setCertificateData(data);
    } catch (err) {
      setError(err.message || "Failed to load provisional certificate.");
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

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto print:static print:p-0 print:m-0 print:overflow-visible print:block print:w-auto print:h-auto">
      {/* ব্যাকড্রপ */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity print:hidden"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-6 print:p-0 print:m-0 print:min-h-0 print:block print:w-auto print:h-auto">
        <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:p-0 print:m-0 print:block print:bg-transparent">
          
          {/* অ্যাকশন বার */}
          <div className="px-6 py-4 bg-[#0c2f54] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 print:hidden">
            <div>
              <h3 className="text-base font-bold">Provisional Certificate</h3>
            </div>

            {/* সার্চ বার - কেবল এডমিনের জন্য দৃশ্যমান */}
            {isAdmin && (
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

          {/* সার্টিফিকেট মূল বডি (স্ক্রোলযোগ্য) */}
          <div className="p-4 sm:p-8 overflow-y-auto flex-1 font-sans bg-[#f8fafc] text-slate-900 flex justify-center print:overflow-visible print:p-0 print:m-0 print:min-h-0 print:h-auto print:block print:bg-transparent">
            
            {loading && (
              <div className="py-20 text-center">
                <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="font-sans text-sm font-semibold text-slate-600">Verifying degree credentials from PostgreSQL...</p>
              </div>
            )}

            {error && !loading && (
              <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center text-red-700 font-sans my-8 max-w-md">
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

            {!loading && !error && certificateData && (
              <ProvisionalCertificate certificateData={certificateData} />
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
