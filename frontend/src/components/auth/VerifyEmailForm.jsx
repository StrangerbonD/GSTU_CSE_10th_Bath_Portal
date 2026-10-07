"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/authService";
import { setAccessToken } from "@/services/authFetch";

export default function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [targetTimestamp, setTargetTimestamp] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // Countdown in seconds

  useEffect(() => {
    // 1. URL search parameter থেকে ইমেইল নেওয়া
    const paramEmail = searchParams?.get("email");
    if (paramEmail) {
      setEmail(paramEmail);
      return;
    }

    // 2. localStorage থেকে সংরক্ষিত ইমেইল নেওয়া
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pending_verify_email");
      if (stored) {
        setEmail(stored);
      }
    }
  }, [searchParams]);

  // ইমেইল সেট হলে localStorage থেকে সংরক্ষিত expiry timestamp লোড বা ইনিশিয়ালাইজ করা
  useEffect(() => {
    if (!email) return;

    const normalizedEmail = email.trim().toLowerCase();
    const storageKey = `otp_expires_at_${normalizedEmail}`;

    let target = null;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > 0) {
          target = parsed;
        }
      }

      // যদি পূর্বে টাইম সেভ করা না থাকে (যেমন সরাসরি লিংকে এলে), তবে ৫ মিনিটের নতুন এক্সপায়ারি সেভ হবে
      if (!target) {
        target = Date.now() + 300 * 1000;
        localStorage.setItem(storageKey, target.toString());
      }
    }

    if (target) {
      setTargetTimestamp(target);
      const remaining = Math.max(0, Math.ceil((target - Date.now()) / 1000));
      setTimeLeft(remaining);
    }
  }, [email]);

  // টার্গেট টাইমের উপর ভিত্তি করে সঠিক কাউন্টডাউন টাইমার পরিচালনা (রিফ্রেশ করলেও টাইম সংরক্ষিত থাকবে)
  useEffect(() => {
    if (!targetTimestamp) return;

    const updateTimer = () => {
      const diff = Math.max(0, Math.ceil((targetTimestamp - Date.now()) / 1000));
      setTimeLeft(diff);
      return diff;
    };

    const currentRemaining = updateTimer();
    if (currentRemaining <= 0) return;

    const timer = setInterval(() => {
      const rem = updateTimer();
      if (rem <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTimestamp]);

  const formatTimer = (seconds) => {
    if (seconds <= 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }

    if (otp.length < 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const result = await authService.verifyEmail(email, otp);

      if (!result.success) {
        setErrorMessage(result.message || "Invalid or expired 6-digit verification code. Please request a new code.");
        
        // কোড এক্সপায়ার্ড হলে টাইমার অবিলম্বে শূন্য করে রিসেন্ড অপশন সচল করা
        if (
          result.message?.toLowerCase().includes("expired") || 
          result.message?.toLowerCase().includes("no active") ||
          result.message?.toLowerCase().includes("locked")
        ) {
          setTimeLeft(0);
          setTargetTimestamp(null);
          if (typeof window !== "undefined" && email) {
            localStorage.removeItem(`otp_expires_at_${email.trim().toLowerCase()}`);
          }
        }
        return;
      }

      setSuccessMessage(result.message || "Email verified successfully!");

      // ভেরিফাই সম্পন্ন হলে টোকেন এবং ইউজার ইনফো সেভ হবে
      if (result.token && result.user) {
        setAccessToken(result.token);
        localStorage.setItem("auth_user", JSON.stringify(result.user));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth_user_updated"));
        }
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("pending_verify_email");
        localStorage.removeItem("pending_verify_otp");
        if (email) {
          localStorage.removeItem(`otp_expires_at_${email.trim().toLowerCase()}`);
        }
      }

      // ভেরিফিকেশনের পর টপ রাইটে প্রোফাইল ও লগআউট শো করবে
      setTimeout(() => {
        if (result.user?.role === "Admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      }, 1200);
    } catch (err) {
      setErrorMessage(err?.message || "Invalid or expired verification code. Please request a new code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setErrorMessage("");
    setResendMessage("");

    if (!email.trim()) {
      setErrorMessage("Please provide your email address to resend the code.");
      return;
    }

    if (timeLeft > 0) {
      setErrorMessage(`Please wait ${formatTimer(timeLeft)} before requesting a new code.`);
      return;
    }

    setResending(true);

    try {
      const result = await authService.resendOtp(email);
      if (!result.success) {
        setErrorMessage(result.message || "Failed to resend code. Please try again.");
        return;
      }
      setResendMessage(result.message || "A new 6-digit verification code has been sent!");
      
      // নতুন কোড পাঠালে নতুন ৫ মিনিটের timestamp সংরক্ষণ ও টাইমার রিসেট করা
      const newExpiry = Date.now() + 300 * 1000;
      if (typeof window !== "undefined") {
        const normalizedEmail = email.trim().toLowerCase();
        localStorage.setItem(`otp_expires_at_${normalizedEmail}`, newExpiry.toString());
      }
      setTargetTimestamp(newExpiry);
      setTimeLeft(300);

      setTimeout(() => setResendMessage(""), 5000);
    } catch (err) {
      setErrorMessage(err?.message || "Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-7 sm:p-9 transition hover:shadow-md">
      
      {/* হেডার (কোনো আইকন নেই) */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
          Verify Your Email
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
          Enter the 6-digit verification code sent to your email
        </p>
      </div>

      {/* সাকসেস মেসেজ */}
      {successMessage && (
        <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl font-medium">
          {successMessage}
        </div>
      )}

      {/* রিসেন্ড মেসেজ */}
      {resendMessage && (
        <div className="mb-5 p-3.5 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-xl font-medium">
          {resendMessage}
        </div>
      )}

      {/* এরর মেসেজ (কোনো আইকন নেই) */}
      {errorMessage && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-medium">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-5">

        {/* রেজিস্টার্ড ইমেইল ইনপুট (Non-editable) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Registered Email Address
          </label>
          <div>
            <input
              type="email"
              readOnly
              value={email}
              className="w-full px-4 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-700 font-medium text-sm outline-none cursor-not-allowed select-all"
            />
          </div>
        </div>
        
        {/* OTP ইনপুট সেকশন */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Enter 6-Digit Code
            </label>
            <div className="text-xs font-semibold">
              {timeLeft > 0 ? (
                <span className={timeLeft <= 60 ? "text-red-600 font-mono font-bold" : "text-emerald-700 font-mono font-bold"}>
                  Expires in {formatTimer(timeLeft)}
                </span>
              ) : (
                <span className="text-red-600 font-bold">Code Expired</span>
              )}
            </div>
          </div>
          <input
            type="text"
            required
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="w-full px-4 py-3 bg-slate-50/70 border border-slate-300 rounded-xl text-slate-900 text-2xl tracking-[0.4em] font-mono outline-none focus:bg-white focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/15 transition text-center shadow-xs"
          />
        </div>

        {/* Verify বাটন */}
        <div>
          <button
            type="submit"
            disabled={loading || timeLeft === 0}
            className="w-full h-12 bg-[#0e3b2e] hover:bg-[#134e3e] text-white font-bold text-base rounded-xl transition duration-150 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Verifying Code...</span>
              </>
            ) : (
              <span>Verify & Continue</span>
            )}
          </button>
        </div>

        {/* Resend OTP বাটন (৫ মিনিট পার হওয়ার পরেই কেবল রিকোয়েস্ট করা যাবে) */}
        <div>
          <button
            type="button"
            disabled={resending || timeLeft > 0}
            onClick={handleResend}
            className="w-full h-11 border border-slate-200 hover:border-slate-300 bg-slate-50/80 hover:bg-slate-100/80 text-slate-700 font-medium text-sm rounded-xl text-center flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {resending ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin"></span>
                <span>Sending Code...</span>
              </>
            ) : timeLeft > 0 ? (
              <span>Resend Code in {formatTimer(timeLeft)}</span>
            ) : (
              <span>Resend OTP Code</span>
            )}
          </button>
        </div>

      </form>

      {/* ব্যাক লিংকসমূহ */}
      <div className="text-center mt-7 pt-5 border-t border-slate-100 flex items-center justify-center gap-3 text-sm">
        <Link href="/register" className="text-emerald-700 font-bold hover:underline">
          ← Back to Register Page
        </Link>
        <span className="text-slate-300">•</span>
        <Link href="/login" className="text-slate-600 font-medium hover:underline">
          Back to Login
        </Link>
      </div>

    </div>
  );
}