"use client";

export default function UserDashboard({
  users = [],
  search = "",
  onSearchChange,
  onToggleStatus,
  onRoleChange,
  onDeleteUser,
  actionLoading = null,
}) {
  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.fullName?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.studentId?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            User Dashboard
          </h2>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search user by name, email, roll..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-[#0e3b2e] focus:ring-2 focus:ring-emerald-700/15 transition"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
              <th className="py-3.5 px-4">User Profile</th>
              <th className="py-3.5 px-4">Email Address</th>
              <th className="py-3.5 px-4 text-center">Batch Student?</th>
              <th className="py-3.5 px-4 text-center">Role</th>
              <th className="py-3.5 px-4 text-center">Account Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/70 transition">
                
                {/* User Profile */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-800 text-sm overflow-hidden">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        u.fullName?.charAt(0) || "U"
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {u.fullName}
                        {u.isCr && <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">CR</span>}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">@{u.username}</div>
                    </div>
                  </div>
                </td>

                {/* Email */}
                <td className="py-3.5 px-4">
                  <div className="text-slate-800 font-medium">{u.email}</div>
                  <div className="text-[10px] text-slate-400">
                    {u.isEmailVerified ? (
                      <span className="text-emerald-700 font-semibold">Verified</span>
                    ) : (
                      <span className="text-amber-600">Pending OTP</span>
                    )}
                  </div>
                </td>

                {/* Batch Student Status */}
                <td className="py-3.5 px-4 text-center">
                  {u.isVerifiedBatchStudent ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      {u.studentId || "10th Batch"}
                    </span>
                  ) : u.studentId ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      Claiming {u.studentId}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-medium text-[11px]">General User</span>
                  )}
                </td>

                {/* Role Dropdown */}
                <td className="py-3.5 px-4 text-center">
                  <select
                    value={u.role}
                    onChange={(e) => onRoleChange(u.id, e.target.value)}
                    className="bg-white border border-slate-300 font-bold text-slate-800 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="User">User</option>
                    <option value="Student">Student</option>
                    <option value="Admin">Admin</option>
                  </select>
                </td>

                {/* Enable / Disable Account Toggle */}
                <td className="py-3.5 px-4 text-center">
                  <button
                    disabled={actionLoading === `toggle-${u.id}` || u.username === "admin"}
                    onClick={() => onToggleStatus(u.id, u.fullName)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer ${
                      u.isActive !== false
                        ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-red-50 hover:bg-red-100 text-red-700 border border-red-300"
                    } ${u.username === "admin" ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span>{u.isActive !== false ? "Active" : "Disabled"}</span>
                  </button>
                </td>

                {/* Delete Action */}
                <td className="py-3.5 px-4 text-right">
                  {u.username !== "admin" ? (
                    <button
                      onClick={() => onDeleteUser(u.id, u.username)}
                      className="px-2.5 py-1 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg text-xs font-bold transition cursor-pointer"
                      title="Delete User"
                    >
                      Delete
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Super</span>
                  )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
