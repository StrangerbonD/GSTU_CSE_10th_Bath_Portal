"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const draft = sessionStorage.getItem("register_form_draft");
        if (draft) {
          const parsed = JSON.parse(draft);
          if (parsed.fullName) setFullName(parsed.fullName);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.password) setPassword(parsed.password);
          if (parsed.confirmPassword) setConfirmPassword(parsed.confirmPassword);
        }
      } catch (e) {}
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!STRONG_PASSWORD_REGEX.test(password)) {
      setError("Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      const res = await authService.register({
        fullName,
        email,
        password,
      });

      if (!res.success) {
        setError(res.message || "Failed to create account. Please try again.");
        return;
      }

      if (typeof window !== "undefined") {
        const expiryTime = Date.now() + 5 * 60 * 1000;
        localStorage.setItem("pending_verify_email", email.trim());
        localStorage.setItem(`otp_expires_at_${email.trim().toLowerCase()}`, expiryTime.toString());
        if (res.otp) {
          localStorage.setItem("pending_verify_otp", res.otp);
        }
        sessionStorage.setItem("register_form_draft", JSON.stringify({ fullName, email, password, confirmPassword }));
      }

      router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-7 sm:p-9 transition hover:shadow-md">
      
      {/* ফর্ম হেডার ও শিরোনাম */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
          Create an Account
        </h1>
      </div>

      {/* এরর মেসেজ বক্স */}
      {error && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* ১. Full Name ইনপুট */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <div>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-slate-900 text-sm outline-none focus:bg-white focus:border-amber-500 focus:ring-3 focus:ring-amber-500/15 transition"
            />
          </div>
        </div>

        {/* ২. Email ইনপুট */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-slate-900 text-sm outline-none focus:bg-white focus:border-amber-500 focus:ring-3 focus:ring-amber-500/15 transition"
            />
          </div>
        </div>

        {/* ৩. Password ইনপুট */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-4 pr-11 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-slate-900 text-sm outline-none focus:bg-white focus:border-amber-500 focus:ring-3 focus:ring-amber-500/15 transition"
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

        {/* ৪. Confirm Password ইনপুট */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-4 pr-11 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-slate-900 text-sm outline-none focus:bg-white focus:border-amber-500 focus:ring-3 focus:ring-amber-500/15 transition"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer select-none p-1"
              title={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? (
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

        {/* ৫. Register বাটন (অ্যাম্বার/গোল্ডেন ব্র্যান্ড অ্যাকসেন্ট) */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-base rounded-xl transition duration-150 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99]"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Register</span>
            )}
          </button>
        </div>

        {/* ৬. Already have an Account? Login লিংক বক্স */}
        <div className="pt-1">
          <Link
            href="/login"
            className="w-full py-2.5 border border-slate-200 hover:border-slate-300 bg-slate-50/80 hover:bg-slate-100/80 text-slate-700 font-medium text-sm rounded-xl text-center block transition"
          >
            Already have an Account? Login
          </Link>
        </div>

      </form>

      {/* ব্যাক টু হোম লিংক */}
      <div className="text-center mt-6 pt-4 border-t border-slate-100">
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-700 transition inline-flex items-center gap-1">
          <span>←</span> Back to Home
        </Link>
      </div>

    </div>
  );
}