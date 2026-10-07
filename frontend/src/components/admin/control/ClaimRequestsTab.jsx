import { useState } from "react";
import DetailDrawer from "./DetailDrawer";

export default function ClaimRequestsTab({
  users = [],
  onApprove,
  onReject,
  onRefresh,
  actionLoading = null,
}) {
  const [selectedUser, setSelectedUser] = useState(null);
  const claimUsers = users.filter((u) => u.claimStatus !== "None");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button onClick={onRefresh} className="text-emerald-700 font-bold hover:underline text-xs cursor-pointer">
          Refresh
        </button>
      </div>

      {claimUsers.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          No batch claim requests submitted yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Claimed Roll</th>
                <th className="py-3 px-4">Recognition Note</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {claimUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{u.fullName}</div>
                    <div className="text-[11px] text-slate-400">@{u.username} • {u.email}</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-800 text-sm">
                    {u.studentId}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs">
                    {u.recognitionNote ? (
                      <button
                        type="button"
                        onClick={() => setSelectedUser(u)}
                        className="text-left text-emerald-800 hover:text-emerald-950 font-medium hover:underline cursor-pointer truncate max-w-[220px] block"
                        title="Click to view full recognition note in drawer"
                      >
                        {u.recognitionNote}
                      </button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        u.claimStatus === "Approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : u.claimStatus === "Pending"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {u.claimStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {u.claimStatus !== "Approved" && (
                        <button
                          disabled={actionLoading === `batch-app-${u.id}`}
                          onClick={() => onApprove(u.id, u.studentId)}
                          className="px-3 py-1.5 rounded-lg bg-[#0e3b2e] hover:bg-[#134e3e] text-white font-bold text-xs transition disabled:opacity-50 cursor-pointer"
                        >
                          Accept & Approve
                        </button>
                      )}
                      {u.claimStatus === "Pending" && (
                        <button
                          disabled={actionLoading === `batch-rej-${u.id}`}
                          onClick={() => onReject(u.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 font-semibold text-xs transition disabled:opacity-50 cursor-pointer"
                        >
                          Reject
                        </button>
                      )}
                      {u.claimStatus === "Approved" && (
                        <span className="text-emerald-700 font-bold text-[11px]">
                          Approved
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

      {/* Recognition Note Detail Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title="Recognition Note Details"
        userName={selectedUser?.fullName}
        studentId={selectedUser?.studentId}
        email={selectedUser?.email}
        content={selectedUser?.recognitionNote}
        extraLabel="Current Status"
        extraValue={selectedUser?.claimStatus}
        onApprove={
          selectedUser?.claimStatus !== "Approved"
            ? () => {
                onApprove(selectedUser.id, selectedUser.studentId);
                setSelectedUser(null);
              }
            : null
        }
        onReject={
          selectedUser?.claimStatus === "Pending"
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
