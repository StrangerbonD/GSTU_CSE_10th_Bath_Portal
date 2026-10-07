"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import LeftSidebarDrawer from "./LeftSidebarDrawer";
import ProfileSettingsDrawer from "./ProfileSettingsDrawer";
import { ClaimModal, CrClaimModal, StatusModal } from "@/components/modals";
import { authService } from "@/services/authService";
import { setAccessToken } from "@/services/authFetch";
import { getUserAvatar } from "@/lib/avatar";

export default function Navbar({ initialUser = null }) {
  const pathname = usePathname();
  const router = useRouter();
  // সার্ভার সাইড কুকি (initialUser) থেকে হাইড্রেট হওয়া (জিরো হাইড্রেশন মিসম্যাচ)
  const [user, setUser] = useState(() => {
    if (initialUser) {
      const copy = { ...initialUser };
      if (copy.image && copy.image.includes("photo-1535713875002")) delete copy.image;
      if (copy.avatarUrl && copy.avatarUrl.includes("photo-1535713875002")) delete copy.avatarUrl;
      return copy;
    }
    return null;
  });

  const [mounted, setMounted] = useState(() => Boolean(initialUser));

  // মোডাল ও সাইড ড্রয়ার স্টেট
  const [isLeftMenuOpen, setIsLeftMenuOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [isCrClaimOpen, setIsCrClaimOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loadUser = async () => {
      const storedUser = localStorage.getItem("auth_user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed && parsed.isEmailVerified !== false) {
            if (parsed.image && parsed.image.includes("photo-1535713875002")) delete parsed.image;
            if (parsed.avatarUrl && parsed.avatarUrl.includes("photo-1535713875002")) delete parsed.avatarUrl;
            setUser((prev) => {
              if (
                prev?.id === parsed.id &&
                prev?.role === parsed.role &&
                prev?.fullName === parsed.fullName &&
                (prev?.image === parsed.image || prev?.avatarUrl === parsed.avatarUrl) &&
                prev?.claimStatus === parsed.claimStatus &&
                prev?.isVerifiedBatchStudent === parsed.isVerifiedBatchStudent &&
                prev?.isCr === parsed.isCr &&
                prev?.crClaimStatus === parsed.crClaimStatus
              ) {
                return prev;
              }
              return parsed;
            });

            // রিফ্রেশ যাতে ১০০% ইনস্ট্যান্ট হয় তার জন্য নিরাপদ কুকি সিঙ্ক
            try {
              authService.saveUserMinCookie(parsed);
            } catch {}
          } else {
            setUser(null);
            document.cookie = "auth_user_min=; path=/; max-age=0";
          }
        } catch (e) {
          console.error("Error parsing auth_user in Navbar:", e);
        }
      } else {
        // Facebook-style Persistent Login check (auto-login via HttpOnly cookie)
        try {
          const refreshed = await authService.refreshToken();
          if (refreshed?.user) {
            setAccessToken(refreshed.token);
            const avatar = refreshed.user.avatarUrl || refreshed.user.image;
            const normalizedUser = {
              ...refreshed.user,
              image: avatar,
              avatarUrl: avatar,
            };
            localStorage.setItem("auth_user", JSON.stringify(normalizedUser));
            authService.saveUserMinCookie(normalizedUser);
            setUser(normalizedUser);
          } else {
            setUser(null);
            document.cookie = "auth_user_min=; path=/; max-age=0";
          }
        } catch {
          setUser(null);
        }
      }
    };

    loadUser();

    window.addEventListener("auth_user_updated", loadUser);
    window.addEventListener("storage", loadUser);

    return () => {
      window.removeEventListener("auth_user_updated", loadUser);
      window.removeEventListener("storage", loadUser);
    };
  }, []);

  const isApprovedStudent = Boolean(
    user &&
    user.role !== "Admin" &&
    (
      user.isVerifiedBatchStudent === true ||
      user.claimStatus === "Approved" ||
      user.claimStatus === 2 ||
      user.claimStatus === "approved"
    )
  );

  const isAuthPage =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/verify-email");

  // নেভিগেশন দ্রুত করার জন্য ইউজার পারমিশন অনুযায়ী ব্যাকগ্রাউন্ডে প্রিফেচ
  useEffect(() => {
    const routesToPrefetch = ["/", "/academics", "/resources", "/statistics"];
    if (user) {
      routesToPrefetch.push("/dashboard");
    }
    if (isApprovedStudent) {
      routesToPrefetch.push("/transcript");
      routesToPrefetch.push("/certificate");
    }
    if (user?.role === "Admin") {
      routesToPrefetch.push("/admin");
    }
    routesToPrefetch.forEach((route) => {
      try {
        router.prefetch(route);
      } catch {}
    });
  }, [router, user, isApprovedStudent]);

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    document.cookie = "auth_user_min=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#0e3b2e] border-b border-[#08261e] shadow-md px-4 sm:px-8 h-16 flex items-center print:hidden">
        <div className="max-w-7xl mx-auto w-full h-full flex items-center justify-between">
          
          {/* ============================================================== */}
          {/* বামপাশের অংশ: সাইড মেনু বাটন + Home, Academics, Resources */}
          {/* ============================================================== */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* ৩-বার মেনু বাটন (শুধুমাত্র সাধারণ ইউজারদের দেখাবে, এডমিনের ক্ষেত্রে মেনু আইকন থাকবে না) */}
            {user && user.role !== "Admin" && (
              <button
                onClick={() => setIsLeftMenuOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-[#86efac] hover:text-white transition cursor-pointer select-none border border-white/15"
                title="Open Left Menu"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            )}

            {/* মেনু লিংকসমূহ */}
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <Link
                href="/"
                prefetch={true}
                onMouseEnter={() => router.prefetch("/")}
                onTouchStart={() => router.prefetch("/")}
                className={`font-bold px-3 sm:px-4 py-1.5 rounded-lg text-sm transition ${
                  pathname === "/"
                    ? "bg-white text-[#0e3b2e] shadow-sm"
                    : "bg-white/10 hover:bg-white/20 text-white font-medium"
                }`}
              >
                Home
              </Link>
              <Link
                href="/academics"
                prefetch={true}
                onMouseEnter={() => router.prefetch("/academics")}
                onTouchStart={() => router.prefetch("/academics")}
                className={`font-bold px-3 sm:px-4 py-1.5 rounded-lg text-sm transition ${
                  pathname === "/academics"
                    ? "bg-white text-[#0e3b2e] shadow-sm"
                    : "bg-white/10 hover:bg-white/20 text-white font-medium"
                }`}
              >
                Academics
              </Link>
              <Link
                href="/resources"
                prefetch={true}
                onMouseEnter={() => router.prefetch("/resources")}
                onTouchStart={() => router.prefetch("/resources")}
                className={`font-bold px-3 sm:px-4 py-1.5 rounded-lg text-sm transition ${
                  pathname === "/resources"
                    ? "bg-white text-[#0e3b2e] shadow-sm"
                    : "bg-white/10 hover:bg-white/20 text-white font-medium"
                }`}
              >
                Resources
              </Link>

              {/* স্ট্যাটিস্টিক্স লিংক (সবার জন্য উন্মুক্ত ও দৃশ্যমান, কোনো আইকন নেই) */}
              <Link
                href="/statistics"
                prefetch={true}
                onMouseEnter={() => router.prefetch("/statistics")}
                onTouchStart={() => router.prefetch("/statistics")}
                className={`font-bold px-3 sm:px-4 py-1.5 rounded-lg text-sm transition ${
                  pathname === "/statistics"
                    ? "bg-white text-[#0e3b2e] shadow-sm"
                    : "bg-white/10 hover:bg-white/20 text-white font-medium"
                }`}
              >
                Statistics
              </Link>

              {/* অ্যাডমিন লিংক (এডমিনের জন্য Admin Dashboard, কোন আইকন ছাড়া) */}
              {user?.role === "Admin" && (
                <Link
                  href="/admin"
                  prefetch={true}
                  onMouseEnter={() => router.prefetch("/admin")}
                  onTouchStart={() => router.prefetch("/admin")}
                  className={`font-bold px-3 sm:px-4 py-1.5 rounded-lg text-sm transition ${
                    pathname === "/admin"
                      ? "bg-white text-[#0e3b2e] shadow-sm"
                      : "bg-white/10 hover:bg-white/20 text-white font-medium"
                  }`}
                >
                  Admin Dashboard
                </Link>
              )}

              {/* রেজাল্টস মেনু (হোভার করলে Transcript ও Demo Certificate সরাসরি পেজ লিংক, কোনো আইকন ছাড়া) */}
              {isApprovedStudent && (
                <div 
                  className="relative group"
                  onMouseEnter={() => {
                    router.prefetch("/transcript");
                    router.prefetch("/certificate");
                  }}
                >
                  <button
                    type="button"
                    className={`flex items-center gap-1.5 font-bold px-3 sm:px-4 py-1.5 rounded-lg text-sm transition cursor-pointer select-none border border-transparent ${
                      pathname === "/transcript" || pathname === "/certificate"
                        ? "bg-white text-[#0e3b2e] shadow-sm"
                        : "bg-white/10 hover:bg-white/20 text-white hover:border-white/15"
                    }`}
                  >
                    <span>Results</span>
                    <svg
                      className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180 text-emerald-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* ড্রপডাউন মেনু (হোভার করলে দৃশ্যমান হবে, কোনো মোডাল বা ড্রয়ার নয়, সরাসরি পেজ লিংক) */}
                  <div className="hidden group-hover:block absolute left-0 top-full pt-1.5 w-44 z-50 animate-in fade-in duration-150">
                    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 py-1 overflow-hidden ring-1 ring-black/5 divide-y divide-slate-100">
                      <Link
                        href="/transcript"
                        prefetch={true}
                        onMouseEnter={() => router.prefetch("/transcript")}
                        onTouchStart={() => router.prefetch("/transcript")}
                        className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-semibold transition block ${
                          pathname === "/transcript"
                            ? "bg-emerald-50 text-[#0e3b2e] font-bold"
                            : "text-slate-800 hover:bg-emerald-50 hover:text-[#0e3b2e]"
                        }`}
                      >
                        Transcript
                      </Link>
                      <Link
                        href="/certificate"
                        prefetch={true}
                        onMouseEnter={() => router.prefetch("/certificate")}
                        onTouchStart={() => router.prefetch("/certificate")}
                        className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-semibold transition block ${
                          pathname === "/certificate"
                            ? "bg-emerald-50 text-[#0e3b2e] font-bold"
                            : "text-slate-800 hover:bg-emerald-50 hover:text-[#0e3b2e]"
                        }`}
                      >
                        Demo Certificate
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </nav>
          </div>

          {/* ============================================================== */}
          {/* ডানপাশের অংশ: শুধু ছবি -> নাম -> LogOut বাটন */}
          {/* ============================================================== */}
          <div className="flex items-center min-h-[40px]">
            {user ? (
              <div className="flex items-center space-x-3 sm:space-x-4">
                
                {/* প্রোফাইল ছবি ও নাম (এডমিনের ক্ষেত্রে ক্লিক করলে প্রোফাইল সেটিংস ওপেন হবে) */}
                {user.role === "Admin" ? (
                  <button
                    type="button"
                    onClick={() => setIsProfileSettingsOpen(true)}
                    className="flex items-center gap-2 hover:opacity-95 transition group cursor-pointer text-left select-none"
                    title="Admin Profile Setting"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#86efac] shadow-sm bg-slate-100 shrink-0 group-hover:ring-white transition">
                      <img
                        src={getUserAvatar(user)}
                        alt={user.fullName || "Admin Profile"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.userName || "Admin")}&background=0e3b2e&color=fff`;
                        }}
                      />
                    </div>
                    <span className="text-white font-bold text-sm sm:text-base group-hover:text-emerald-200 transition">
                      {user.fullName || user.userName || "Admin"}
                    </span>
                  </button>
                ) : (
                  <Link
                    href="/dashboard"
                    prefetch={true}
                    onMouseEnter={() => router.prefetch("/dashboard")}
                    onTouchStart={() => router.prefetch("/dashboard")}
                    className="flex items-center gap-2 hover:opacity-95 transition group"
                    title="Go to Dashboard"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#86efac] shadow-sm bg-slate-100 shrink-0 group-hover:ring-white transition">
                      <img
                        src={getUserAvatar(user)}
                        alt={user.fullName || "User Profile"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.userName || "User")}&background=0e3b2e&color=fff`;
                        }}
                      />
                    </div>
                    <span className="text-white font-bold text-sm sm:text-base group-hover:text-emerald-200 transition">
                      {user.fullName || user.userName || "Bondhon"}
                    </span>
                  </Link>
                )}

                {/* LogOut বাটন */}
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs sm:text-sm shadow-sm transition active:scale-95 cursor-pointer select-none"
                  title="Logout from portal"
                >
                  LogOut
                </button>
              </div>
            ) : !mounted ? (
              <div className="h-9 w-24 bg-white/10 rounded-lg animate-pulse" />
            ) : (
              !isAuthPage && (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Link
                    href="/login"
                    prefetch={true}
                    onMouseEnter={() => router.prefetch("/login")}
                    className="bg-white text-[#0e3b2e] hover:bg-slate-100 font-bold px-4 py-1.5 rounded-lg text-sm shadow-sm transition"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    prefetch={true}
                    onMouseEnter={() => router.prefetch("/register")}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-sm shadow-sm transition active:scale-95"
                  >
                    Register
                  </Link>
                </div>
              )
            )}
          </div>

        </div>
      </header>

      {/* বামপাশ থেকে স্লাইড হওয়া সাইডবার ড্রয়ার (Left Sidebar Drawer) */}
      <LeftSidebarDrawer
        isOpen={isLeftMenuOpen}
        onClose={() => setIsLeftMenuOpen(false)}
        onOpenProfileSettings={() => setIsProfileSettingsOpen(true)}
        onOpenClaim={() => setIsClaimOpen(true)}
        onOpenCrClaim={() => setIsCrClaimOpen(true)}
        onOpenStatus={() => setIsStatusOpen(true)}
        onOpenTranscript={() => router.push("/transcript")}
        onOpenStatistics={() => router.push("/statistics")}
        onOpenCertificate={() => router.push("/certificate")}
      />

      {/* প্রোফাইল সেটিংস ড্রয়ার (Setting Profile) */}
      <ProfileSettingsDrawer
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
        onUpdateUser={(updated) => setUser(updated)}
      />

      {/* Claim মোডাল */}
      <ClaimModal
        isOpen={isClaimOpen}
        onClose={() => setIsClaimOpen(false)}
      />

      {/* Claim as CR মোডাল */}
      <CrClaimModal
        isOpen={isCrClaimOpen}
        onClose={() => setIsCrClaimOpen(false)}
      />

      {/* Status মোডাল */}
      <StatusModal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
      />
    </>
  );
}
