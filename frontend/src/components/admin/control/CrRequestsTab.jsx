import { useState } from "react";
import DetailDrawer from "./DetailDrawer";

export default function CrRequestsTab({
  users = [],
  onApprove,
  onReject,
  onRefresh,
  actionLoading = null,
}) {
  const [selectedUser, setSelectedUser] = useState(null);
  const crClaimUsers = users.filter((u) => u.crClaimStatus !== "None");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button onClick={onRefresh} className="text-emerald-700 font-bold hover:underline text-xs cursor-pointer">
          Refresh
        </button>
      </div>

      {crClaimUsers.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          No CR recognition requests submitted yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Roll</th>
                <th className="py-3 px-4">CR Claim Note</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {crClaimUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{u.fullName}</div>
                    <div className="text-[11px] text-slate-400">@{u.username}</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                    {u.studentId || "—"}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs">
                    {u.crClaimNote ? (
                      <button
                        type="button"
                        onClick={() => setSelectedUser(u)}
                        className="text-left text-blue-700 hover:text-blue-900 font-medium hover:underline cursor-pointer truncate max-w-[220px] block"
                        title="Click to view full CR claim note in drawer"
                      >
                        {u.crClaimNote}
                      </button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        u.crClaimStatus === "Approved"
                          ? "bg-blue-100 text-blue-800"
                          : u.crClaimStatus === "Pending"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {u.crClaimStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {u.crClaimStatus !== "Approved" && (
                        <button
                          disabled={actionLoading === `cr-app-${u.id}`}
                          onClick={() => onApprove(u.id, u.username)}
                          className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition disabled:opacity-50 cursor-pointer"
                        >
                          Accept as CR
                        </button>
                      )}
                      {u.crClaimStatus === "Pending" && (
                        <button
                          disabled={actionLoading === `cr-rej-${u.id}`}
                          onClick={() => onReject(u.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 font-semibold text-xs transition disabled:opacity-50 cursor-pointer"
                        >
                          Reject
                        </button>
                      )}
                      {u.crClaimStatus === "Approved" && (
                        <span className="text-blue-700 font-bold text-[11px]">
                          Active CR
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CR Claim Note Detail Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title="CR Claim Note Details"
        userName={selectedUser?.fullName}
        studentId={selectedUser?.studentId}
        email={selectedUser?.email}
        content={selectedUser?.crClaimNote}
        extraLabel="Current Status"
        extraValue={selectedUser?.crClaimStatus}
        approveText="Accept as CR"
        onApprove={
          selectedUser?.crClaimStatus !== "Approved"
            ? () => {
                onApprove(selectedUser.id, selectedUser.username);
                setSelectedUser(null);
              }
            : null
        }
        onReject={
          selectedUser?.crClaimStatus === "Pending"
            ? () => {
                onReject(selectedUser.id);
                setSelectedUser(null);
              }
            : null
        }
      />
    </div>
  );
}
