"use client";

import ClaimRequestsTab from "./control/ClaimRequestsTab";
import CrRequestsTab from "./control/CrRequestsTab";
import CrThoughtsTab from "./control/CrThoughtsTab";
import UserThoughtsTab from "./control/UserThoughtsTab";

export default function ControlDashboard({
  subTab = "claims",
  onSubTabChange,
  users = [],
  thoughts = [],
  onApproveBatchClaim,
  onRejectBatchClaim,
  onApproveCrClaim,
  onRejectCrClaim,
  onApproveCrThought,
  onRejectCrThought,
  onApproveThought,
  onDisallowThought,
  onDeleteThought,
  onRefresh,
  actionLoading = null,
}) {
  const pendingBatchClaimsCount = users.filter((u) => u.claimStatus === "Pending").length;
  const pendingCrClaimsCount = users.filter((u) => u.crClaimStatus === "Pending").length;
  const pendingCrThoughtsCount = users.filter((u) => u.isCr && (u.crThoughtStatus === "Pending" || u.pendingCrThought)).length;
  const crThoughtsCount = users.filter((u) => u.isCr && (u.crThought || u.crTenure)).length;
  const pendingUserThoughtsCount = thoughts.filter((t) => !t.isApproved).length;
  const userThoughtsCount = thoughts.length;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Control Dashboard
        </h2>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 no-scrollbar">
        
        {/* 1. Batch Claim Requests */}
        <button
          onClick={() => onSubTabChange("claims")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            subTab === "claims"
              ? "bg-[#0e3b2e] text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <span>Claim Requests</span>
          {pendingBatchClaimsCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center justify-center">
              {pendingBatchClaimsCount}
            </span>
          )}
        </button>

        {/* 2. CR Requests */}
        <button
          onClick={() => onSubTabChange("cr_requests")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            subTab === "cr_requests"
              ? "bg-[#0e3b2e] text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <span>CR Requests</span>
          {pendingCrClaimsCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center justify-center">
              {pendingCrClaimsCount}
            </span>
          )}
        </button>

        {/* 3. CR Thoughts */}
        <button
          onClick={() => onSubTabChange("cr_thoughts")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            subTab === "cr_thoughts"
              ? "bg-[#0e3b2e] text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <span>CR Thoughts</span>
          {pendingCrThoughtsCount > 0 ? (
            <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center justify-center">
              {pendingCrThoughtsCount}
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
              {crThoughtsCount}
            </span>
          )}
        </button>

        {/* 4. User Thoughts */}
        <button
          onClick={() => onSubTabChange("user_thoughts")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            subTab === "user_thoughts"
              ? "bg-[#0e3b2e] text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <span>User Thoughts</span>
          {pendingUserThoughtsCount > 0 ? (
            <span className="px-1.5 py-0.2 rounded bg-amber-400 text-amber-950 text-[10px] font-bold">
              {pendingUserThoughtsCount}
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
              {userThoughtsCount}
            </span>
          )}
        </button>

      </div>

      {/* Render Active Sub-Tab */}
      {subTab === "claims" && (
        <ClaimRequestsTab
          users={users}
          onApprove={onApproveBatchClaim}
          onReject={onRejectBatchClaim}
          onRefresh={onRefresh}
          actionLoading={actionLoading}
        />
      )}

      {subTab === "cr_requests" && (
        <CrRequestsTab
          users={users}
          onApprove={onApproveCrClaim}
          onReject={onRejectCrClaim}
          onRefresh={onRefresh}
          actionLoading={actionLoading}
        />
      )}

      {subTab === "cr_thoughts" && (
        <CrThoughtsTab
          users={users}
          onApprove={onApproveCrThought}
          onReject={onRejectCrThought}
          onRefresh={onRefresh}
          actionLoading={actionLoading}
        />
      )}

      {subTab === "user_thoughts" && (
        <UserThoughtsTab
          thoughts={thoughts}
          onApprove={onApproveThought}
          onDisallow={onDisallowThought}
          onDelete={onDeleteThought}
          onRefresh={onRefresh}
          actionLoading={actionLoading}
        />
      )}

    </div>
  );
}
