"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProfileSettingsDrawer from "@/components/layout/ProfileSettingsDrawer";
import CrShipExperienceModule from "@/components/home/CrShipExperienceModule";
import { authService } from "@/services/authService";
import { portalService } from "@/services/portalService";
import { setAccessToken } from "@/services/authFetch";
import { getUserAvatar } from "@/lib/avatar";

import {
  saveUserThoughtCookie,
  clearUserThoughtCookie,
  saveUserMinCookie,
} from "@/lib/authCookies";

export default function DashboardClient({ initialUser = null, initialThought = null }) {
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // সিঙ্ক ইনিশিয়ালাইজেশন: সার্ভার কুকি (initialUser) থেকে হাইড্রেট হওয়া (জিরো হাইড্রেশন এরর)
  const [user, setUser] = useState(() => initialUser || {
    fullName: "",
    userName: "",
    role: "User",
    studentId: "",
    session: "",
    bloodGroup: "",
    email: "",
    statusMessage: "",
  });

  const [existingThought, setExistingThought] = useState(() => initialThought || null);
  const [loadingThought, setLoadingThought] = useState(() => !initialThought);
  const [myThought, setMyThought] = useState(() => initialThought?.quote || "");
  const [successMsg, setSuccessMsg] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUserThought = async () => {
    try {
      const th = await portalService.getMyThought();
      setExistingThought((prev) => {
        if (!prev && !th) return null;
        if (
          prev &&
          th &&
          prev.id === th.id &&
          prev.quote === th.quote &&
          prev.isApproved === th.isApproved
        ) {
          return prev;
        }
        return th;
      });
      if (th?.quote) {
        setMyThought((prev) => (prev ? prev : th.quote));
      }
    } catch (err) {
      console.warn("Failed fetching my thought:", err);
    } finally {
      setLoadingThought(false);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      const storedUser = localStorage.getItem("auth_user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed && parsed.isEmailVerified !== false) {
            setUser((prev) => {
              if (
                prev?.id === parsed.id &&
                prev?.role === parsed.role &&
                prev?.fullName === parsed.fullName &&
                (prev?.image === parsed.image || prev?.avatarUrl === parsed.avatarUrl) &&
                prev?.claimStatus === parsed.claimStatus &&
                prev?.isVerifiedBatchStudent === parsed.isVerifiedBatchStudent &&
                prev?.isCr === parsed.isCr &&
                prev?.crClaimStatus === parsed.crClaimStatus &&
                prev?.crTenure === parsed.crTenure &&
                prev?.crThought === parsed.crThought &&
                prev?.pendingCrTenure === parsed.pendingCrTenure &&
                prev?.pendingCrThought === parsed.pendingCrThought
              ) {
                return prev;
              }
              return {
                ...prev,
                ...parsed,
              };
            });
            saveUserMinCookie(parsed);
            return;
          }
        } catch (e) {
          console.error("Error reading stored user:", e);
        }
      }

      // Check persistent session if not already available
      if (!initialUser?.id) {
        try {
          const refreshed = await authService.refreshToken();
          if (refreshed?.user) {
            setAccessToken(refreshed.token);
            const avatar = refreshed.user.avatarUrl || refreshed.user.image;
            const normalized = {
              ...refreshed.user,
              image: avatar,
              avatarUrl: avatar,
            };
            localStorage.setItem("auth_user", JSON.stringify(normalized));
            authService.saveUserMinCookie(normalized);
            setUser(normalized);
          } else {
            router.push("/login");
          }
        } catch {
          router.push("/login");
        }
      }
    };

    loadUserData();
    fetchUserThought();
    // ড্যাশবোর্ডে প্রবেশের সময় ব্যাকগ্রাউন্ড থেকে প্রোফাইল ও CR স্ট্যাটাস রিয়েল-টাইম সিঙ্ক
    authService.syncCurrentUser();

    window.addEventListener("auth_user_updated", loadUserData);
    return () => {
      window.removeEventListener("auth_user_updated", loadUserData);
    };
  }, [initialUser?.id, router]);

  const handleLogout = async () => {
    await authService.logout();
    router.push("/login");
  };

  const handlePostThought = async (e) => {
    e.preventDefault();
    if (!myThought.trim()) return;

    setActionLoading(true);
    try {
      const res = await portalService.createThought(myThought.trim());
      setExistingThought(res);
      setIsEditing(false);
      setSuccessMsg("Your thought has been submitted! It will appear on the landing page once allowed by the admin.");
      setTimeout(() => {
        setSuccessMsg("");
      }, 5000);
    } catch (err) {
      alert(err.message || "Failed to share thought");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteThought = async () => {
    if (!confirm("Are you sure you want to delete your shared thought?")) return;
    setActionLoading(true);
    try {
      await portalService.deleteMyThought();
      setExistingThought(null);
      setMyThought("");
      setIsEditing(false);
      setSuccessMsg("Your thought has been removed.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      alert(err.message || "Failed to delete thought");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between font-sans text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* ============================================================== */}
      {/* ২. মূল ড্যাশবোর্ড বডি এরিয়া */}
      {/* ============================================================== */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        
        {/* টপ ওয়েলকাম প্রোফাইল ব্যানার */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            {/* গোল প্রোফাইল অবতার */}
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-4 ring-[#86efac] shadow-sm bg-slate-100 shrink-0">
              <img
                src={getUserAvatar(user)}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.userName || "User")}&background=0e3b2e&color=fff`;
                }}
              />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200/70 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Online</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Welcome back, {user.fullName || user.userName || "Batchmate"}!
              </h1>
            </div>
          </div>

          {/* Profile Settings বাটন */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="self-start sm:self-auto bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-900 font-bold p-2.5 sm:px-3 sm:py-2.5 rounded-xl text-base shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center"
            title="Profile Settings"
          >
            <span>⚙️</span>
          </button>
        </div>

        {/* প্রোফাইল সেটিংস স্লাইড ড্রয়ার */}
        <ProfileSettingsDrawer
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onUpdateUser={(updated) => setUser(updated)}
        />

        {/* ড্যাশবোর্ড ফিড এরিয়া */}
        <div className="space-y-6">
          
          {/* পোস্ট ক্রিয়েটর বা শেয়ার্ড থট প্রিভিউ কার্ড */}
          {loadingThought && !existingThought ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6 sm:p-7 animate-pulse space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="space-y-2 w-1/3">
                  <div className="h-4 bg-slate-200 rounded"></div>
                  <div className="h-3 bg-slate-100 rounded w-2/3"></div>
                </div>
                <div className="h-6 w-24 bg-slate-100 rounded-full"></div>
              </div>
              <div className="h-20 bg-slate-50 border border-slate-100 rounded-2xl"></div>
            </div>
          ) : existingThought && !isEditing ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6 sm:p-7 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Your Shared Thought
                  </h3>
                  <p className="text-xs text-slate-400">
                    Your memory shared with the 10th batch community
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      existingThought.isApproved
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-amber-50 text-amber-900 border-amber-200"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        existingThought.isApproved
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-amber-500"
                      }`}
                    />
                    <span>
                      {existingThought.isApproved
                        ? "Approved & Live on Landing"
                        : "Pending Admin Approval"}
                    </span>
                  </span>
                </div>
              </div>

              {successMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
                  <span>✅</span>
                  <span>{successMsg}</span>
                </div>
              )}


              {/* থট কোটেশন কার্ড */}
              <div className="relative bg-slate-50/80 border border-slate-200 rounded-2xl p-5 sm:p-6 text-slate-900">
                <div className="text-2xl text-emerald-700 font-serif leading-none mb-1 select-none">
                  “
                </div>
                <p className="text-sm sm:text-base italic text-slate-800 leading-relaxed font-serif pl-2">
                  {existingThought.quote}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">
                      {user.fullName || user.userName}
                    </span>
                    {user.isVerifiedBatchStudent && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
                        GSTU CSE 10th Batch
                      </span>
                    )}
                  </div>
                  <span>{existingThought.time || "Recently"}</span>
                </div>
              </div>

              {/* অ্যাকশন বাটনসমূহ: এডিট ও ডিলিট */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => {
                    setMyThought(existingThought.quote);
                    setIsEditing(true);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  Edit Thought
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleDeleteThought}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 active:scale-95 text-red-700 border border-red-200 font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6 sm:p-7">
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {isEditing ? "Edit Your Shared Thought" : "Share a Thought or Campus Memory"}
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">Max 100 words</span>
              </div>

              {successMsg && (
                <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
                  <span>✅</span>
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handlePostThought} className="space-y-4">
                <div>
                  <textarea
                    rows={4}
                    value={myThought}
                    onChange={(e) => setMyThought(e.target.value)}
                    placeholder="Write a message, memories from lab classes, campus moments, or a wish for your batchmates..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/15 transition resize-none leading-relaxed"
                    maxLength={600}
                  ></textarea>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    Characters: {myThought.length}/600
                  </p>

                  <div className="flex items-center gap-2">
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setMyThought(existingThought?.quote || "");
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={!myThought.trim() || actionLoading}
                      className="bg-[#0e3b2e] hover:bg-[#134e3e] text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {actionLoading
                        ? "Saving..."
                        : isEditing
                        ? "Update Thought"
                        : "Share Thought"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ২. ক্লাস রিপ্রেজেন্টেটিভ এক্সপেরিয়েন্স ও জার্নি সাবমিশন কার্ড (শুধুমাত্র অনুমোদিত CR ইউজারদের জন্য) */}
          <CrShipExperienceModule user={user} />
        </div>

      </main>

      {/* ============================================================== */}
      {/* ৩. ফুটার */}
      {/* ============================================================== */}
      <footer className="w-full bg-[#0f172a] text-slate-400 py-6 text-center text-sm font-medium border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-slate-300 font-semibold">
            GSTU CSE 10<sup>th</sup> Batch Portal
          </p>
          <p className="text-slate-400 text-xs sm:text-sm">
            @strangerbond . All right reserved
          </p>
        </div>
      </footer>

    </div>
  );
}
