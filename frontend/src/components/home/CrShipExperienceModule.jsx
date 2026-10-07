"use client";

import { useState, useEffect } from "react";
import { portalService } from "@/services/portalService";
import { saveUserMinCookie } from "@/lib/authCookies";

const SEMESTERS = [
  { id: 1, label: "1st Year 1st Semester" },
  { id: 2, label: "1st Year 2nd Semester" },
  { id: 3, label: "2nd Year 1st Semester" },
  { id: 4, label: "2nd Year 2nd Semester" },
  { id: 5, label: "3rd Year 1st Semester" },
  { id: 6, label: "3rd Year 2nd Semester" },
  { id: 7, label: "4th Year 1st Semester" },
  { id: 8, label: "4th Year 2nd Semester" },
];

function parseTenureSemesters(tenureStr) {
  if (!tenureStr) return { from: 1, to: 1 };
  const parts = tenureStr.split(" to ");
  const fromPart = parts[0]?.trim();
  const toPart = (parts[1] || parts[0])?.trim();
  const fromObj = SEMESTERS.find((s) => s.label.toLowerCase() === fromPart?.toLowerCase());
  const toObj = SEMESTERS.find((s) => s.label.toLowerCase() === toPart?.toLowerCase());
  return {
    from: fromObj ? fromObj.id : 1,
    to: toObj ? toObj.id : 1,
  };
}

export default function CrShipExperienceModule({ user, onUpdated }) {
  const [fromSemId, setFromSemId] = useState(() => parseTenureSemesters(user?.pendingCrTenure || user?.crTenure).from);
  const [toSemId, setToSemId] = useState(() => parseTenureSemesters(user?.pendingCrTenure || user?.crTenure).to);
  const [note, setNote] = useState(() => user?.pendingCrThought || user?.crThought || "");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isCr = Boolean(
    user?.isCr === true ||
    user?.crClaimStatus === "Approved" ||
    user?.crClaimStatus === 2 ||
    user?.crClaimStatus === "approved"
  );

  const hasPending = Boolean(
    user?.crThoughtStatus === "Pending" ||
    user?.pendingCrThought ||
    user?.pendingCrTenure
  );

  const hasApprovedLive = Boolean(
    user?.crTenure || user?.crThought
  );

  // Sync form state if user changes in background without redundant re-renders
  useEffect(() => {
    const nextNote = user?.pendingCrThought || user?.crThought || "";
    setNote((prev) => (prev === nextNote ? prev : nextNote));

    const t = parseTenureSemesters(user?.pendingCrTenure || user?.crTenure);
    setFromSemId((prev) => (prev === t.from ? prev : t.from));
    setToSemId((prev) => (prev === t.to ? prev : t.to));
  }, [user?.pendingCrThought, user?.crThought, user?.pendingCrTenure, user?.crTenure]);

  if (!isCr) return null;

  // Calculate word count
  const countWords = (text) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const wordCount = countWords(note);

  // Available "To" semesters: cannot be earlier than selected "From" semester
  const availableToSemesters = SEMESTERS.filter((s) => s.id >= fromSemId);

  const handleFromChange = (newFromId) => {
    setFromSemId(newFromId);
    if (toSemId < newFromId) {
      setToSemId(newFromId);
    }
  };

  // Generate tenure string
  const getTenureString = () => {
    const fromSem = SEMESTERS.find((s) => s.id === fromSemId);
    const toSem = SEMESTERS.find((s) => s.id === toSemId);

    if (!fromSem) return "";
    if (fromSemId === toSemId || !toSem) {
      return fromSem.label;
    }
    return `${fromSem.label} to ${toSem.label}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user?.id) {
      setError("Please log in to submit your CR experience.");
      return;
    }

    if (wordCount === 0) {
      setError("Please write a short note about your Class Representative journey.");
      return;
    }

    if (wordCount > 50) {
      setError(`Your note exceeds the 50-word limit (currently ${wordCount} words). Please shorten it.`);
      return;
    }

    const tenure = getTenureString();

    setLoading(true);
    try {
      const updatedUser = await portalService.submitCrThought(user.id, {
        tenure,
        thought: note.trim(),
      });

      // Update local storage
      const stored = localStorage.getItem("auth_user");
      let merged = { ...updatedUser };
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          merged = { ...parsed, ...updatedUser };
        } catch (e) {}
      }
      localStorage.setItem("auth_user", JSON.stringify(merged));
      saveUserMinCookie(merged);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth_user_updated"));
      }

      setSuccess("Your CR duration and story have been submitted! Waiting for Admin approval.");
      setIsEditing(false);

      if (onUpdated) {
        onUpdated();
      }
    } catch (err) {
      setError(err.message || "Failed to submit CR experience. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6">
      {/* হেডার */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-2 border border-emerald-200">
              Verified Class Representative
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Share your journey as a CR.
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {hasPending && (
              <span className="text-xs bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-xl border border-amber-200">
                Update Pending Admin Approval
              </span>
            )}
            {hasApprovedLive && !hasPending && (
              <span className="text-xs bg-emerald-100 text-emerald-900 font-bold px-3 py-1 rounded-xl border border-emerald-200">
                Live on Home Page ✓
              </span>
            )}
          </div>
        </div>

        {/* এলার্ট মেসেজ */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-2xl">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-2xl font-semibold">
            {success}
          </div>
        )}

        {/* যদি ইতিমধ্যে সাবমিটেড থাকে এবং বর্তমানে এডিটিং মোডে না থাকে: স্ট্যাটাস রিভিউ কার্ড */}
        {(hasPending || hasApprovedLive) && !isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* লাইভ অনুমোদিত বিবরণ */}
              {hasApprovedLive && (
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Current Live Info
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      Active
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Tenure Duration</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      {user.crTenure || "GSTU CSE 10th Batch"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Quote / Story</div>
                    <p className="text-xs sm:text-sm text-slate-700 italic mt-0.5 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/70">
                      &ldquo;{user.crThought || "No quote recorded."}&rdquo;
                    </p>
                  </div>
                </div>
              )}

              {/* পেন্ডিং রিকোয়েস্ট বিবরণ */}
              {hasPending && (
                <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                      Pending Request (Under Review)
                    </span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                      Pending
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-amber-700 font-medium">Requested Tenure</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      {user.pendingCrTenure || "Not specified"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-amber-700 font-medium">Requested Note</div>
                    <p className="text-xs sm:text-sm text-slate-800 italic mt-0.5 leading-relaxed bg-white p-3 rounded-xl border border-amber-200/60 font-mono">
                      &ldquo;{user.pendingCrThought}&rdquo;
                    </p>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Admin approval is pending. Once approved, previous info will be replaced with this update.
                  </p>
                </div>
              )}

            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 bg-[#0e3b2e] hover:bg-[#134e3e] text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {hasPending ? "Edit & Resubmit Request" : "Update CR Tenure & Story"}
              </button>
            </div>
          </div>
        ) : (
          /* ফর্ম সেকশন */
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* সেমিস্টার ডিউরেশন রো */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* ১. From Semester */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  From Semester
                </label>
                <select
                  value={fromSemId}
                  onChange={(e) => handleFromChange(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 outline-none transition cursor-pointer"
                >
                  {SEMESTERS.map((sem) => (
                    <option key={sem.id} value={sem.id}>
                      {sem.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Starting semester of your Class Representative tenure.
                </p>
              </div>

              {/* ২. To Semester (Validated: Cannot be before From Semester) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  To Semester
                </label>
                <select
                  value={toSemId}
                  onChange={(e) => setToSemId(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 outline-none transition cursor-pointer"
                >
                  {availableToSemesters.map((sem) => (
                    <option key={sem.id} value={sem.id}>
                      {sem.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  {fromSemId === toSemId
                    ? "Single semester selected."
                    : "Ending semester of your Class Representative tenure."}
                </p>
              </div>

            </div>

            {/* লাইভ ডিউরেশন প্রিভিউ */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Selected Duration:</span>
              <span className="font-bold text-[#0e3b2e] bg-emerald-100/70 px-3 py-1 rounded-lg">
                {getTenureString()}
              </span>
            </div>

            {/* ৩. ৫০ শব্দের নোট / বক্তব্য টেক্সট এরিয়া */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  About Your CR-Ship (Max 50 Words)
                </label>
                <span
                  className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                    wordCount > 50
                      ? "bg-red-100 text-red-700"
                      : wordCount > 40
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {wordCount} / 50 words
                </span>
              </div>
              <textarea
                rows={4}
                required
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={`w-full p-4 bg-slate-50 border rounded-2xl text-slate-900 text-sm focus:bg-white outline-none transition resize-none leading-relaxed ${
                  wordCount > 50
                    ? "border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/15"
                    : "border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15"
                }`}
              ></textarea>
              {wordCount > 50 ? (
                <p className="text-xs text-red-600 font-semibold mt-1.5">
                  Your note exceeds 50 words. Please remove {wordCount - 50} word(s) before submitting.
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1">
                  Keep it concise within 50 words. This will appear on your card in the Home Page CR section once approved.
                </p>
              )}
            </div>

            {/* সাবমিশন বাটনসমূহ */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {(hasPending || hasApprovedLive) && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <div className="ml-auto">
                <button
                  type="submit"
                  disabled={loading || wordCount === 0 || wordCount > 50}
                  className="px-6 py-2.5 bg-[#0e3b2e] hover:bg-[#134e3e] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {loading
                    ? "Submitting..."
                    : hasPending
                    ? "Update & Re-Submit Request"
                    : "Submit CR Experience for Approval"}
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
  );
}
