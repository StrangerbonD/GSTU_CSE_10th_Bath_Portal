"use client";

import { useState } from "react";
import DetailDrawer from "./DetailDrawer";

export default function UserThoughtsTab({
  thoughts = [],
  onApprove,
  onDisallow,
  onDelete,
  onRefresh,
  actionLoading = null,
}) {
  const [selectedThought, setSelectedThought] = useState(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Review community thoughts. Only <strong>Allowed</strong> thoughts will appear on the Home/Landing page speech bubble.
        </p>
        <button
          onClick={onRefresh}
          className="text-emerald-700 font-bold hover:underline text-xs cursor-pointer shrink-0"
        >
          Refresh
        </button>
      </div>

      {thoughts.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 border border-slate-200/80 rounded-2xl">
          No thoughts submitted yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {thoughts.map((th) => {
            const isApproving = actionLoading === `th-app-${th.id}`;
            const isDisallowing = actionLoading === `th-dis-${th.id}`;

            return (
              <div
                key={th.id}
                className={`bg-slate-50 border rounded-2xl p-5 flex flex-col justify-between space-y-3 transition ${
                  th.isApproved
                    ? "border-emerald-200/80 hover:border-emerald-300"
                    : "border-amber-200/90 bg-amber-50/20 hover:border-amber-300"
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">
                      {th.authorName || "Batchmate"}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        th.isApproved
                          ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                          : "bg-amber-100 text-amber-900 border-amber-200"
                      }`}
                    >
                      {th.isApproved ? "Allowed" : "Pending"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedThought(th)}
                    className="w-full text-left text-xs text-slate-700 italic bg-white p-3 rounded-xl border border-slate-200 hover:border-emerald-300 transition cursor-pointer line-clamp-3 block selection:bg-emerald-100"
                    title="Click to view full thought in drawer"
                  >
                    &ldquo;{th.quote}&rdquo;
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  {!th.isApproved ? (
                    <button
                      type="button"
                      disabled={Boolean(actionLoading)}
                      onClick={() => onApprove(th.id)}
                      className="px-3.5 py-1.5 bg-[#0e3b2e] hover:bg-[#134e3e] active:scale-95 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isApproving ? "Allowing..." : "Allow"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={Boolean(actionLoading)}
                      onClick={() => onDisallow?.(th.id)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                      title="Hide from landing page"
                    >
                      {isDisallowing ? "Disallowing..." : "Disallow"}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={Boolean(actionLoading)}
                    onClick={() => onDelete(th.id)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 active:scale-95 text-red-700 border border-red-300 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Thought Detail Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedThought)}
        onClose={() => setSelectedThought(null)}
        title="Batch Community Thought"
        userName={selectedThought?.authorName}
        content={selectedThought?.quote}
        extraLabel="Status"
        extraValue={
          selectedThought?.isApproved
            ? "Allowed (Live on Landing Page)"
            : "Pending (Hidden from Landing Page)"
        }
        approveText={selectedThought?.isApproved ? "Disallow" : "Allow"}
        rejectText="Delete"
        onApprove={() => {
          if (!selectedThought?.isApproved) {
            onApprove(selectedThought.id);
          } else {
            onDisallow?.(selectedThought.id);
          }
          setSelectedThought(null);
        }}
        onReject={() => {
          onDelete(selectedThought.id);
          setSelectedThought(null);
        }}
      />
    </div>
  );
}
