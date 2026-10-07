"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/authService";
import { setAccessToken } from "@/services/authFetch";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userName, setUserName] = useState("");
  const [passWord, setPassWord] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isSessionExpired = searchParams.get("reason") === "session_expired";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await authService.login(userName, passWord);
      
      if (!data.success) {
        setError(data.message || "Invalid username or password. Please try again.");
        return;
      }

      if (data.token) {
        setAccessToken(data.token);
        localStorage.setItem("auth_user", JSON.stringify(data.user));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth_user_updated"));
        }

        if (data.user?.role === "Admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
        return;
      }
    } catch (err) {
      setError(err.message || "Invalid username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-7 sm:p-9 transition hover:shadow-md">
      
      {/* ফর্ম হেডার ও শিরোনাম */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
          Log in to this Portal
        </h1>
      </div>

      {/* সেশন এক্সপায়ার্ড নোটিস */}
      {isSessionExpired && !error && (
        <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
          <p className="font-medium">
            Your session has expired. Please log in again to continue.
          </p>
        </div>
      )}

      {/* এরর মেসেজ বক্স (কোনো আইকন নেই) */}
      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          <p>{error}</p>
          {error.toLowerCase().includes("verify your email") && (
            <Link
              href={`/verify-email?email=${encodeURIComponent(userName.trim())}`}
              className="mt-2 inline-block font-bold text-emerald-800 underline hover:text-emerald-950 text-xs"
            >
              Go to Verify Email Page →
            </Link>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* ১. Username বা Email ইনপুট */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Email or Username
          </label>
          <div>
            <input
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50/70 border border-slate-300 rounded-xl text-slate-900 text-sm outline-none focus:bg-white focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/15 transition"
            />
          </div>
        </div>

        {/* ২. Password ইনপুট */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Password
            </label>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={passWord}
              onChange={(e) => setPassWord(e.target.value)}
              className="w-full pl-4 pr-11 py-3 bg-slate-50/70 border border-slate-300 rounded-xl text-slate-900 text-sm outline-none focus:bg-white focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/15 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer select-none p-1"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" y1="2" x2="22" y2="22" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* ৩. Log In বাটন (ডিপ অ্যাকাডেমিক গ্রিন) */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0e3b2e] hover:bg-[#134e3e] text-white font-bold text-base rounded-xl transition duration-150 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99]"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Logging in...</span>
              </>
            ) : (
              <span>Log In</span>
            )}
          </button>
        </div>

        {/* ৪. Forgotten Password লিংক বক্স */}
        <div className="pt-1">
          <Link
            href="#"
            className="w-full py-2.5 border border-slate-200 hover:border-slate-300 bg-slate-50/80 hover:bg-slate-100/80 text-slate-700 font-medium text-sm rounded-xl text-center block transition"
          >
            Forgotten Password?
          </Link>
        </div>

      </form>

      {/* ৫. ফুটার লিংকসমূহ */}
      <div className="text-center mt-7 pt-5 border-t border-slate-100 space-y-2">
        <p className="text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-emerald-700 font-bold hover:underline">
            Register here
          </Link>
        </p>
        <div>
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-700 transition inline-flex items-center gap-1">
            <span>←</span> Back to Home
          </Link>
        </div>
      </div>

    </div>
  );
}