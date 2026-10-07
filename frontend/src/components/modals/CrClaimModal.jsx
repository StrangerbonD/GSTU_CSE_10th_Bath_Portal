"use client";

import { useState, useEffect } from "react";
import { portalService } from "@/services/portalService";
import { authService } from "@/services/authService";
import { saveUserMinCookie } from "@/lib/authCookies";

export default function CrClaimModal({ isOpen, onClose }) {
  const [user, setUser] = useState(null);
  const [crClaimNote, setCrClaimNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen) {
      setError("");
      setSuccess("");
      const stored = localStorage.getItem("auth_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          setCrClaimNote(parsed.crClaimNote || "");
        } catch (e) {
          setUser(null);
        }
        authService.syncCurrentUser().then((fresh) => {
          if (fresh) setUser(fresh);
        });
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isApproved = user?.isCr === true || user?.crClaimStatus === "Approved" || user?.crClaimStatus === 2;
  const isPending = !isApproved && (user?.crClaimStatus === "Pending" || user?.crClaimStatus === 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!crClaimNote.trim()) {
      setError("Please describe your CR tenure or representation details.");
      return;
    }

    if (!user?.id) {
      setError("Please log in to submit a CR claim.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await portalService.submitCrClaim(user.id, crClaimNote.trim());

      const updatedUser = {
        ...user,
        crClaimStatus: "Pending",
        crClaimNote: crClaimNote.trim(),
      };

      localStorage.setItem("auth_user", JSON.stringify(updatedUser));
      saveUserMinCookie(updatedUser);
      setUser(updatedUser);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth_user_updated"));
      }

      setSuccess("Your CR recognition request has been submitted successfully! Awaiting Admin acknowledgment.");
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err) {
      setError(err.message || "Failed to submit CR claim request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* ব্যাকড্রপ */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 sm:p-8">
          
          {/* হেডার (কোনো আইকন নেই) */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Claim as Class Representative (CR)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Submit tenure details for GSTU CSE 10th Batch CR recognition
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer select-none text-base"
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* স্ট্যাটাস ব্যানারসমূহ */}
          {isApproved ? (
            <div className="my-5 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-sm">
              <div className="font-bold mb-1">Approved Class Representative</div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                You are officially recognized as a Class Representative for GSTU CSE 10th Batch.
              </p>
              {user?.crTenure && (
                <p className="text-xs font-semibold mt-2 text-emerald-950">
                  Tenure: {user.crTenure}
                </p>
              )}
            </div>
          ) : isPending ? (
            <div className="my-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-sm">
              <div className="font-bold mb-1">Pending Admin Review</div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Your CR recognition request has been submitted and is currently waiting for Admin acknowledgment.
              </p>
              {user?.crClaimNote && (
                <p className="text-xs text-amber-950 mt-2 bg-white/60 p-2.5 rounded-xl border border-amber-200/60 font-mono">
                  Submitted Note: &ldquo;{user.crClaimNote}&rdquo;
                </p>
              )}
            </div>
          ) : null}

          {/* অ্যালার্ট মেসেজ */}
          {error && (
            <div className="my-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl">
              {error}
            </div>
          )}

          {success && (
            <div className="my-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-xl font-medium">
              {success}
            </div>
          )}

          {/* ফর্ম */}
          {!isApproved && (
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.fullName || user?.username || ""}
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-sm cursor-not-allowed outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Student ID / Roll
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.studentId || "Not claimed yet"}
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-sm cursor-not-allowed outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  CR Tenure & Details
                </label>
                <textarea
                  rows={4}
                  required
                  value={crClaimNote}
                  onChange={(e) => setCrClaimNote(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm outline-none focus:bg-white focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/15 transition resize-none leading-relaxed"
                ></textarea>
                <p className="text-[11px] text-slate-400 mt-1">
                  Mention the semester, year, or duration you served as Class Representative.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#0e3b2e] hover:bg-[#134e3e] text-white font-bold text-sm rounded-xl transition duration-150 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <span>{isPending ? "Update CR Claim Note" : "Submit CR Claim"}</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {isApproved && (
            <div className="pt-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
