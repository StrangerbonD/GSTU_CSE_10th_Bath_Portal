"use client";

export default function AdminHeader({
  activeTab,
  onTabChange,
  studentCount = 33,
  userCount = 0,
  recognizedCount = 0,
  pendingCount = 0,
  photoCount = 0,
}) {
  return (
    <section className="bg-[#0e3b2e] text-white border-b border-[#08261e] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Main Admin Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 no-scrollbar">
            
            {/* Tab 1: Student Result Dashboard */}
            <button
              onClick={() => onTabChange("students")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "students"
                  ? "bg-white text-[#0e3b2e] shadow-sm"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <span>Student Result Dashboard</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-black/10 font-bold">
                {studentCount}
              </span>
            </button>

            {/* Tab 2: User Dashboard */}
            <button
              onClick={() => onTabChange("users")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "users"
                  ? "bg-white text-[#0e3b2e] shadow-sm"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <span>User Dashboard</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-black/10 font-bold">
                {userCount}
              </span>
            </button>

            {/* Tab 3: Control Dashboard */}
            <button
              onClick={() => onTabChange("control")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "control"
                  ? "bg-white text-[#0e3b2e] shadow-sm"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <span>Control Dashboard</span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-amber-400 text-slate-950 font-bold">
                  {pendingCount}
                </span>
              )}
            </button>

            {/* Tab 4: Landing page Photo collection */}
            <button
              onClick={() => onTabChange("landing_photos")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "landing_photos"
                  ? "bg-white text-[#0e3b2e] shadow-sm"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <span>Landing page</span>
              {photoCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-black/10 font-bold">
                  {photoCount}
                </span>
              )}
            </button>

          </div>

          {/* Metrics Counter: User, Recognized Students, Pending */}
          <div className="flex items-center gap-2.5 shrink-0 no-scrollbar">
            <div className="bg-white/10 px-3.5 py-1.5 rounded-xl text-center border border-white/10 min-w-[75px]">
              <div className="text-[10px] uppercase font-bold text-emerald-200">User</div>
              <div className="text-base font-extrabold text-white">{userCount}</div>
            </div>

            <div className="bg-white/10 px-3.5 py-1.5 rounded-xl text-center border border-white/10 min-w-[130px]">
              <div className="text-[10px] uppercase font-bold text-emerald-200">Recognized Students</div>
              <div className="text-base font-extrabold text-white">{recognizedCount}</div>
            </div>

            <div className="bg-white/10 px-3.5 py-1.5 rounded-xl text-center border border-white/10 min-w-[75px]">
              <div className="text-[10px] uppercase font-bold text-amber-300">Pending</div>
              <div className="text-base font-extrabold text-amber-300">{pendingCount}</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
