"use client";

import { useState } from "react";
import DetailDrawer from "./DetailDrawer";
import { getUserAvatar } from "@/lib/avatar";

export default function CrThoughtsTab({
  users = [],
  onApprove,
  onReject,
  onRefresh,
  actionLoading = null,
}) {
  const [selectedCr, setSelectedCr] = useState(null);

  const crStoryUsers = users.filter(
    (u) => u.isCr && (u.pendingCrThought || u.crThought || u.crThoughtStatus === "Pending")
  );

  return (
    <div className="space-y-4">
      {/* অ্যাকশন বার */}
      <div className="flex items-center justify-end">
        <button
          onClick={onRefresh}
          className="text-emerald-700 font-bold hover:underline text-xs cursor-pointer"
        >
          Refresh
        </button>
      </div>

      {crStoryUsers.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 border border-slate-200/80 rounded-2xl">
          No CR story submissions found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Tenure</th>
                <th className="py-3 px-4">Thought</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {crStoryUsers.map((u) => {
                const isPending = Boolean(u.pendingCrThought || u.crThoughtStatus === "Pending");
                const activeThought = u.pendingCrThought || u.crThought || "";
                const activeTenure = u.pendingCrTenure || u.crTenure || "GSTU CSE 10th Batch";

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={getUserAvatar(u)}
                          alt={u.fullName || "CR"}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || "CR")}&background=0e3b2e&color=fff`;
                          }}
                        />
                        <div>
                          <div className="font-bold text-slate-900">{u.fullName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {u.studentId || "CR"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-700 font-medium">
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold text-[10px]">
                        {activeTenure}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-700 max-w-xs">
                      {activeThought ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedCr({
                              ...u,
                              activeThought,
                              activeTenure,
                              isPending,
                            })
                          }
                          className="text-left text-emerald-800 hover:text-emerald-950 font-medium hover:underline cursor-pointer truncate max-w-[240px] block"
                          title="Click to open full CR thought in drawer"
                        >
                          &ldquo;{activeThought}&rdquo;
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">No thought</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isPending
                            ? "bg-amber-100 text-amber-900"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isPending ? "Pending" : "Accepted"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isPending ? (
                          <>
                            <button
                              disabled={actionLoading === `cr-th-app-${u.id}`}
                              onClick={() => onApprove(u.id, u.fullName)}
                              className="px-3 py-1.5 rounded-lg bg-[#0e3b2e] hover:bg-[#134e3e] text-white font-bold text-xs transition disabled:opacity-50 cursor-pointer shadow-xs"
                            >
                              {actionLoading === `cr-th-app-${u.id}` ? "Approving..." : "Accept"}
                            </button>
                            <button
                              disabled={actionLoading === `cr-th-rej-${u.id}`}
                              onClick={() => onReject(u.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 font-semibold text-xs transition disabled:opacity-50 cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-emerald-700 font-bold text-[11px]">
                            Live on Home
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CR Thought Slide Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedCr)}
        onClose={() => setSelectedCr(null)}
        title="Class Representative Story & Thought"
        userName={selectedCr?.fullName}
        studentId={selectedCr?.studentId}
        email={selectedCr?.email}
        content={selectedCr?.activeThought}
        extraLabel="Tenure"
        extraValue={selectedCr?.activeTenure}
        approveText="Accept & Display on Home"
        onApprove={
          selectedCr?.isPending
            ? () => {
                onApprove(selectedCr.id, selectedCr.fullName);
                setSelectedCr(null);
              }
            : null
        }
        onReject={
          selectedCr?.isPending
            ? () => {
                onReject(selectedCr.id);
                setSelectedCr(null);
              }
            : null
        }
      />
    </div>
  );
}
