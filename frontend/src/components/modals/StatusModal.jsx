"use client";

import { useState, useEffect } from "react";

import { portalService } from "@/services/portalService";

export default function StatusModal({ isOpen, onClose }) {
  const [statusMessage, setStatusMessage] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSavedSuccess(false);
      setError("");
      const stored = localStorage.getItem("auth_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setStatusMessage(parsed.statusMessage || "");
        } catch (e) {}
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!statusMessage.trim()) {
      setError("Please write your status.");
      return;
    }

    if (statusMessage.length > 40) {
      setError("Status must be within 40 characters.");
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
        await portalService.updateStatus(currentAuth.id, statusMessage.trim());
      }

      const updatedUser = {
        ...currentAuth,
        statusMessage: statusMessage.trim(),
      };

      localStorage.setItem("auth_user", JSON.stringify(updatedUser));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth_user_updated"));
      }

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to update status message.");
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
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all pt-2">
          
          {/* ক্লোজ বাটন */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer select-none z-10 text-base"
            title="Close"
          >
            ✕
          </button>

          {/* বডি */}
          <div className="p-6 sm:p-7">
            {savedSuccess ? (
              <div className="text-center py-6 space-y-2 animate-fadeIn">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-2xl mx-auto shadow-xs">
                  ✓
                </div>
                <h4 className="text-lg font-bold text-slate-900">Status Updated!</h4>
                <p className="text-xs text-slate-500">
                  Your status has been saved successfully.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4 animate-fadeIn">
                
                {/* টাইটেল / প্রম্পট */}
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight pr-6">
                    Share your current academic and career status
                  </h4>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* টেক্সট বক্স (সর্বোচ্চ ৪০ ক্যারেক্টার) */}
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      autoFocus
                      required
                      value={statusMessage}
                      placeholder="e.g. Software Engineer @ Brain Station"
                      onChange={(e) => {
                        if (e.target.value.length <= 40) {
                          setStatusMessage(e.target.value);
                          setError("");
                        }
                      }}
                      maxLength={40}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 outline-none transition"
                    />
                  </div>

                  {/* ক্যারেক্টার কাউন্টার (সর্বোচ্চ ৪০) */}
                  <div className="flex items-center justify-between mt-1.5 px-0.5">
                    <span className="text-[11px] text-slate-400">
                      Maximum 40 characters
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        statusMessage.length >= 38
                          ? "text-amber-600"
                          : "text-slate-400"
                      }`}
                    >
                      {statusMessage.length}/40
                    </span>
                  </div>
                </div>

                {/* বাটনসমূহ */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-[#0e3b2e] hover:bg-[#134e3e] rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Save Status</span>
                  </button>
                </div>

              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
