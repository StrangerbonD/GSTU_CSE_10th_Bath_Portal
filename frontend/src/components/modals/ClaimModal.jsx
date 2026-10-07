"use client";

import { useState, useEffect } from "react";

import { portalService } from "@/services/portalService";
import { authService } from "@/services/authService";
import { saveUserMinCookie } from "@/lib/authCookies";

export default function ClaimModal({ isOpen, onClose }) {
  // isCSE10th: null (initial question), true (proceed to form), false (rejected/not from batch)
  const [currentUser, setCurrentUser] = useState(null);
  const [isCSE10th, setIsCSE10th] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [recognitionNote, setRecognitionNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setIsCSE10th(null);
      setSubmitted(false);
      setError("");
      setRecognitionNote("");

      const stored = localStorage.getItem("auth_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCurrentUser(parsed);
          setStudentId(parsed.studentId || "");
        } catch (e) {
          setCurrentUser(null);
          setStudentId("");
        }
        authService.syncCurrentUser().then((fresh) => {
          if (fresh) {
            setCurrentUser(fresh);
            if (fresh.studentId) setStudentId(fresh.studentId);
          }
        });
      } else {
        setCurrentUser(null);
        setStudentId("");
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isApproved = Boolean(
    currentUser?.isVerifiedBatchStudent === true ||
    currentUser?.claimStatus === "Approved" ||
    currentUser?.claimStatus === 2 ||
    currentUser?.claimStatus === "approved"
  );
  const isPending = !isApproved && Boolean(
    currentUser?.claimStatus === "Pending" ||
    currentUser?.claimStatus === 1 ||
    currentUser?.claimStatus === "pending"
  );
  const isClaimed = isApproved || isPending;

  const handleNoClick = () => {
    setIsCSE10th(false);
    setError("");
  };

  const handleYesClick = () => {
    setIsCSE10th(true);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId.trim()) {
      setError("Please enter your student ID.");
      return;
    }
    if (!recognitionNote.trim()) {
      setError("Please enter something so StrangerBonD can recognize you.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const stored = localStorage.getItem("auth_user");
      let currentAuth = {};
      if (stored) {
        try {
          currentAuth = JSON.parse(stored);
        } catch (err) {}
      }

      if (currentAuth.id) {
        await portalService.submitClaim(currentAuth.id, studentId.trim(), recognitionNote.trim());
      }

      const updatedUser = {
        ...currentAuth,
        studentId: studentId.trim(),
        isVerifiedBatchStudent: false,
        claimStatus: "Pending",
        recognitionNote: recognitionNote.trim(),
      };

      localStorage.setItem("auth_user", JSON.stringify(updatedUser));
      saveUserMinCookie(updatedUser);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth_user_updated"));
      }

      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setIsCSE10th(null);
      }, 2500);
    } catch (err) {
      setError(err.message || "Failed to submit claim request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* ব্যাকড্রপ ওভারলে */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all pt-2">
          
          {/* ক্লোজ বাটন (হেডার বার সরানো হয়েছে, শুধু টপ-রাইট ক্লোজ বাটন রাখা হয়েছে) */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer select-none z-10 text-base"
            title="Close"
          >
            ✕
          </button>

          {/* বডি কনটেন্ট */}
          <div className="p-6 sm:p-7 pt-6">
            
            {/* ১. অলরেডি ক্লেইমড স্ট্যাটাস স্ক্রিন */}
            {isClaimed && !submitted ? (
              <div className="text-center py-6 space-y-4 animate-fadeIn">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-800 rounded-2xl flex items-center justify-center text-2xl mx-auto border border-emerald-200">
                  ✓
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">
                    {isApproved ? "Claim Already Approved" : "Claim Under Review"}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-sm mx-auto leading-relaxed">
                    {isApproved
                      ? `Your profile has been verified as a GSTU CSE 10th Batch student (${currentUser?.studentId || "Verified"}). Your academic results and portal features are active.`
                      : `Your claim for Student ID ${currentUser?.studentId || ""} has already been submitted and is currently awaiting Admin approval.`}
                  </p>
                </div>
                <div className="pt-2">
                  <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border ${
                    isApproved
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-amber-100 text-amber-800 border-amber-300"
                  }`}>
                    {isApproved ? "CSE 10th Batch Verified ✓" : "Pending Admin Review"}
                  </span>
                </div>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2.5 bg-[#0e3b2e] hover:bg-[#134e3e] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : submitted ? (
              /* ২. সাবমিশন সাকসেস মেসেজ স্ক্রিন */
              <div className="text-center py-6 space-y-3 animate-fadeIn">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-2xl mx-auto shadow-xs">
                  ✓
                </div>
                <h4 className="text-lg font-bold text-slate-900">
                  Claim Submitted for Review!
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Your CSE 10th batch student identity claim has been submitted to Admin. Once approved, your Results and verified batch status will be unlocked.
                </p>
                <div className="pt-2">
                  <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-300">
                    Awaiting Admin Approval
                  </span>
                </div>
              </div>
            ) : isCSE10th === null ? (
              
              /* ============================================================== */
              /* ৩. প্রথম প্রশ্ন: Are you from CSE 10th Batch? Yes / No         */
              /* ============================================================== */
              <div className="text-center py-6 space-y-6 animate-fadeIn">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-900 font-bold rounded-2xl flex items-center justify-center text-sm mx-auto border border-emerald-200/80 shadow-xs">
                  10th
                </div>

                <div>
                  <h4 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    Are you from CSE 10th Batch?
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-xs mx-auto">
                    Please confirm your batch affiliation to proceed with claiming your portal profile.
                  </p>
                </div>

                {/* Yes / No অপশন বাটন */}
                <div className="flex items-center justify-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={handleYesClick}
                    className="flex-1 max-w-[140px] py-3 px-5 bg-[#0e3b2e] hover:bg-[#134e3e] active:scale-95 text-white font-bold text-sm sm:text-base rounded-xl shadow-sm transition cursor-pointer flex items-center justify-center"
                  >
                    <span>Yes</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNoClick}
                    className="flex-1 max-w-[140px] py-3 px-5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-sm sm:text-base rounded-xl border border-slate-300 transition cursor-pointer flex items-center justify-center"
                  >
                    <span>No</span>
                  </button>
                </div>
              </div>

            ) : isCSE10th === false ? (

              /* ============================================================== */
              /* ৪. যদি 'No' সিলেক্ট করা হয়                                      */
              /* ============================================================== */
              <div className="text-center py-6 space-y-4 animate-fadeIn">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">
                    Notice for Guests & Other Batches
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
                    This claim feature is exclusively reserved for members of the <span className="font-semibold text-slate-800">GSTU CSE 10th Batch</span>. You can still explore the public sections of this portal!
                  </p>
                </div>

                <div className="pt-3 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCSE10th(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 bg-[#0e3b2e] hover:bg-[#134e3e] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

            ) : (

              /* ============================================================== */
              /* ৫. যদি 'Yes' হয় -> Student ID + Recognize You Textarea         */
              /* ============================================================== */
              <form onSubmit={handleSubmit} className="space-y-5 animate-fadeIn">
                
                {/* ব্যাচ কনফার্মেশন স্ট্যাটাস বার */}
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs text-emerald-800 font-semibold">
                  <div>CSE 10th Batch Member</div>
                  <button
                    type="button"
                    onClick={() => setIsCSE10th(null)}
                    className="text-emerald-700 hover:underline text-[11px] font-bold cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
                    {error}
                  </div>
                )}

                {/* ক. Student ID ইনপুট */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Enter your student id
                  </label>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 outline-none transition font-mono"
                  />
                </div>

                {/* খ. StrangerBonD can recognize You টেক্সট এরিয়া */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Enter something that StrangerBonD can recognize You
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={recognitionNote}
                    onChange={(e) => setRecognitionNote(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 outline-none transition resize-none leading-relaxed"
                  ></textarea>
                </div>

                {/* বাটনসমূহ */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsCSE10th(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    ← Back
                  </button>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2 text-xs font-bold text-white bg-[#0e3b2e] hover:bg-[#134e3e] rounded-xl shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? "Submitting..." : "Submit Claim"}
                    </button>
                  </div>
                </div>

              </form>

            )}

          </div>

        </div>
      </div>
    </div>
  );
}
