"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { getUserAvatar } from "@/lib/avatar";

export default function LeftSidebarDrawer({
  isOpen,
  onClose,
  onOpenProfileSettings,
  onOpenClaim,
  onOpenCrClaim,
  onOpenStatus,
  onOpenTranscript,
  onOpenStatistics,
  onOpenCertificate,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = () => {
      const stored = localStorage.getItem("auth_user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    if (isOpen) {
      loadUser();
      // Server DB থেকে রিয়েল-টাইম স্ট্যাটাস রিফ্রেশ করা (Approval/CR Status)
      authService.syncCurrentUser().then((fresh) => {
        if (fresh) setUser(fresh);
      });
    }

    window.addEventListener("auth_user_updated", loadUser);
    window.addEventListener("storage", loadUser);
    return () => {
      window.removeEventListener("auth_user_updated", loadUser);
      window.removeEventListener("storage", loadUser);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    onClose();
    router.push("/login");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* ব্যাকড্রপ ওভারলে (Backdrop) */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* বামপাশ থেকে স্লাইড হওয়া ড্রয়ার কনটেইনার */}
      <div className="fixed inset-y-0 left-0 max-w-full flex pr-10">
        <div className="w-80 sm:w-96 bg-white shadow-2xl flex flex-col justify-between border-r border-slate-200 transform transition-transform duration-300 ease-in-out">
          
          {/* ১. ড্রয়ার হেডার */}
          <div className="px-6 py-5 bg-[#0e3b2e] text-white flex items-center justify-between shadow-xs">
            <div>
              <h2 className="text-base font-bold tracking-tight">Portal Menu</h2>
              {(user?.isVerifiedBatchStudent || user?.claimStatus === "Approved" || user?.claimStatus === 2 || user?.claimStatus === "approved") && (
                <p className="text-[11px] text-emerald-200 mt-0.5">GSTU CSE 10th Batch</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer select-none text-base"
              title="Close Menu"
            >
              ✕
            </button>
          </div>

          {/* ২. ড্রয়ার কনটেন্ট ও অপশন এরিয়া */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* ইউজার কার্ড (যদি লগইন করা থাকে) */}
            {user ? (
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-full overflow-hidden ring-3 ring-[#86efac] shadow-sm bg-white shrink-0">
                  <img
                    src={getUserAvatar(user)}
                    alt={user.fullName || "User"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.userName || "User")}&background=0e3b2e&color=fff`;
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full truncate max-w-[190px]">
                      {user.statusMessage && user.statusMessage !== "Active Student" ? user.statusMessage : "Online"}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 truncate mt-1">
                    {user.fullName || user.userName || "Batchmate"}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    {user.email || user.studentId || ""}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-center">
                <p className="text-xs font-semibold text-emerald-900 mb-2.5">
                  Welcome to GSTU CSE 10th Batch Portal!
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Link
                    href="/login"
                    prefetch={true}
                    onClick={onClose}
                    className="bg-[#0e3b2e] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs hover:bg-[#134e3e] transition"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    prefetch={true}
                    onClick={onClose}
                    className="bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs hover:bg-amber-600 transition"
                  >
                    Register
                  </Link>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* মূল ফিচার অপশনসমূহ: Claim, Claim as CR, Profile Setting (কোনো আইকন নেই) */}
            {/* ============================================================== */}
            {user?.role !== "Admin" && (() => {
              const isApproved = Boolean(
                user?.isVerifiedBatchStudent === true ||
                user?.claimStatus === "Approved" ||
                user?.claimStatus === 2 ||
                user?.claimStatus === "approved"
              );
              const isPending = !isApproved && Boolean(
                user?.claimStatus === "Pending" ||
                user?.claimStatus === 1 ||
                user?.claimStatus === "pending"
              );

              const isClaimed = isApproved || isPending;

              const isCrApproved = Boolean(
                user?.isCr === true ||
                user?.crClaimStatus === "Approved" ||
                user?.crClaimStatus === 2 ||
                user?.crClaimStatus === "approved"
              );
              const isCrPending = !isCrApproved && Boolean(
                user?.crClaimStatus === "Pending" ||
                user?.crClaimStatus === 1 ||
                user?.crClaimStatus === "pending"
              );
              const isCrClaimed = isCrApproved || isCrPending;

              return (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1">
                    Main Actions
                  </p>
                  
                  <div className="space-y-2">

                    {/* ১. Claim অপশন (একবার Claim হয়ে গেলে আর ক্লিক করা যাবে না) */}
                    {isClaimed ? (
                      <div className="w-full text-left p-3.5 rounded-xl border border-slate-200 bg-slate-100/70 select-none flex items-center justify-between cursor-default">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-700">
                              Claim
                            </h4>
                            {isApproved && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-200">
                                Approved ✓
                              </span>
                            )}
                            {isPending && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded-full border border-amber-200">
                                Pending Approval
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {isApproved
                              ? "CSE 10th Batch verified"
                              : "Claim submitted • Awaiting Admin approval"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          onClose();
                          if (onOpenClaim) onOpenClaim();
                        }}
                        className="w-full text-left p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/80 hover:bg-emerald-50 hover:border-emerald-300 transition group cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 group-hover:text-emerald-950">
                            Claim
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Claim profile or ID verification
                          </p>
                        </div>
                        <span className="text-slate-400 group-hover:text-emerald-600 font-bold text-sm">
                          →
                        </span>
                      </button>
                    )}

                    {/* ২. Claim as CR অপশন (শুধুমাত্র যদি ইউজার CSE 10th Batch হিসেবে Admin Approved হয়, তখনই শো করবে, তার আগে নয়) */}
                    {isApproved && (
                      isCrClaimed ? (
                        <div className="w-full text-left p-3.5 rounded-xl border border-slate-200 bg-slate-100/70 select-none flex items-center justify-between cursor-default">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-700">
                                Claim as CR
                              </h4>
                              {isCrApproved && (
                                <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-1.5 py-0.5 rounded-full border border-blue-200">
                                  Approved ✓
                                </span>
                              )}
                              {isCrPending && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded-full border border-amber-200">
                                  Pending Approval
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {isCrApproved
                                ? "Verified Class Representative"
                                : "CR claim submitted • Awaiting Admin approval"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            onClose();
                            if (onOpenCrClaim) onOpenCrClaim();
                          }}
                          className="w-full text-left p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/80 hover:bg-emerald-50 hover:border-emerald-300 transition group cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 group-hover:text-emerald-950">
                              Claim as CR
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Request Class Representative recognition
                            </p>
                          </div>
                          <span className="text-slate-400 group-hover:text-emerald-600 font-bold text-sm">
                            →
                          </span>
                        </button>
                      )
                    )}

                    {/* ৩. Profile Setting অপশন */}
                    <button
                      onClick={() => {
                        onClose();
                        if (onOpenProfileSettings) onOpenProfileSettings();
                      }}
                      className="w-full text-left p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/80 hover:bg-emerald-50 hover:border-emerald-300 transition group cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-emerald-950">
                          Profile Setting
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Edit photo, name & password
                        </p>
                      </div>
                      <span className="text-slate-400 group-hover:text-emerald-600 font-bold text-sm">
                        →
                      </span>
                    </button>

                  </div>
                </div>
              );
            })()}



          </div>

          {/* ৩. ড্রয়ার ফুটার */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition cursor-pointer"
              >
                LogOut
              </button>
            ) : (
              <p className="text-[11px] text-slate-400 text-center w-full">
                @strangerbond . All rights reserved
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
