"use client";

import { useEffect } from "react";
import { X, User, FileText, Calendar } from "lucide-react";

export default function DetailDrawer({
  isOpen,
  onClose,
  title = "Details",
  userName = "",
  studentId = "",
  email = "",
  content = "",
  extraLabel = "",
  extraValue = "",
  onApprove = null,
  onReject = null,
  approveText = "Accept & Approve",
  rejectText = "Reject",
  actionLoading = false,
}) {
  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
                <FileText className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {title}
                </h3>
                <p className="text-xs text-slate-500">
                  Detailed preview & submission review
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            
            {/* Student / Author Card */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate">
                    {userName || "Student / User"}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {studentId && (
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {studentId}
                      </span>
                    )}
                    {email && <span className="truncate">{email}</span>}
                  </div>
                </div>
              </div>

              {extraLabel && extraValue && (
                <div className="pt-2 border-t border-slate-200/70 flex items-center gap-2 text-xs text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold text-slate-500 uppercase text-[10px]">{extraLabel}:</span>
                  <span className="font-semibold text-slate-900">{extraValue}</span>
                </div>
              )}
            </div>

            {/* Note / Thought Full Text */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Full Content / Submission Note
              </label>
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4.5 text-sm text-slate-800 leading-relaxed font-serif whitespace-pre-wrap selection:bg-emerald-100">
                {content ? (
                  content
                ) : (
                  <span className="text-slate-400 italic">No additional note provided with this request.</span>
                )}
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-3">
            {onReject && (
              <button
                disabled={actionLoading}
                onClick={onReject}
                className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {rejectText}
              </button>
            )}

            {onApprove && (
              <button
                disabled={actionLoading}
                onClick={onApprove}
                className="px-5 py-2.5 bg-[#0e3b2e] hover:bg-[#134e3e] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {approveText}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
