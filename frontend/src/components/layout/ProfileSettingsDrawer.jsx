"use client";

import { useState, useEffect, useRef } from "react";

import { portalService } from "@/services/portalService";
import { authService } from "@/services/authService";
import { getUserAvatar } from "@/lib/avatar";

const DEFAULT_AVATAR = "https://ui-avatars.com/api/?name=User&background=0e3b2e&color=fff";

export default function ProfileSettingsDrawer({ isOpen, onClose, onUpdateUser }) {
  const fileInputRef = useRef(null);
  const [fullName, setFullName] = useState("");
  const [image, setImage] = useState(DEFAULT_AVATAR);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError("");
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      setSavedSuccess(false);

      const stored = localStorage.getItem("auth_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const userName = parsed.fullName || parsed.userName || "User";
          setFullName(userName);
          setImage(getUserAvatar(parsed));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [isOpen]);

  // ফটো আপলোড হ্যান্ডলার (ডিভাইস থেকে ছবি সিলেক্ট করা)
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ফাইল সাইজ চেক (সর্বোচ্চ ৫ মেগাবাইট)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result); // Base64 স্ট্রিং হিসেবে ইনস্ট্যান্ট প্রিভিউ
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // পাসওয়ার্ড ভ্যালিডেশন (যদি ইউজার পাসওয়ার্ড দিতে চায়)
    if (password) {
      if (!currentPassword) {
        setError("Current password is required to change your password.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setError("New passwords do not match!");
        return;
      }
    }

    setLoading(true);

    try {
      const stored = localStorage.getItem("auth_user");
      let currentAuth = {};
      if (stored) {
        try {
          currentAuth = JSON.parse(stored);
        } catch (err) {}
      }

      if (currentAuth.id) {
        await portalService.updateProfile(currentAuth.id, {
          fullName: fullName.trim(),
          avatarUrl: image,
          currentPassword: currentPassword || null,
          newPassword: password || null,
        });
      }

      const avatarVersion = Date.now();
      const updatedUser = {
        ...currentAuth,
        fullName: fullName.trim(),
        image: image,
        avatarUrl: image,
        avatarVersion: avatarVersion,
      };

      localStorage.setItem("auth_user", JSON.stringify(updatedUser));
      authService.saveUserMinCookie(updatedUser);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth_user_updated"));
      }
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* ব্যাকড্রপ ওভারলে */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex pr-10">
        {/* স্লাইড-ইন সাইড ড্রয়ার (বামপাশ থেকে খুলবে) */}
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-r border-slate-200">
          
          {/* ১. ড্রয়ার হেডার */}
          <div className="px-6 py-5 bg-[#0e3b2e] text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold tracking-tight">Setting Profile</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer select-none text-base"
              title="Close Settings"
            >
              ✕
            </button>
          </div>

          {/* ২. ফর্ম এরিয়া (স্ক্রোলযোগ্য) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* সাকসেস মেসেজ */}
            {savedSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 animate-fadeIn">
                <span>✅</span>
                <span>Profile updated successfully!</span>
              </div>
            )}

            {/* এরর মেসেজ */}
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form id="profile-settings-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* ============================================================== */}
              {/* ক. Photo Upload সেকশন */}
              {/* ============================================================== */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 text-center">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Profile Photo
                </label>

                {/* ছবি প্রিভিউ */}
                <div className="relative w-24 h-24 mx-auto mb-3.5">
                  <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-[#86efac] shadow-md bg-white">
                    <img
                      src={image || DEFAULT_AVATAR}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* ফাইল ইনপুট (হিডেন) */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />

                {/* ফটো আপলোড বাটন */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer inline-flex items-center"
                >
                  <span>Upload New Photo</span>
                </button>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  PNG, JPG or JPEG (Max 5MB)
                </p>
              </div>

              {/* ============================================================== */}
              {/* খ. Full Name সেকশন */}
              {/* ============================================================== */}
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
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 outline-none transition"
                  />
                </div>
              </div>

              {/* ============================================================== */}
              {/* গ. Password পরিবর্তন সেকশন */}
              {/* ============================================================== */}
              <div className="pt-2 border-t border-slate-100 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      New Password
                    </label>
                    <span className="text-[11px] text-slate-400">Leave blank if no change</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-4 pr-11 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer select-none p-1"
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

                {password && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Current Password (Required)
                    </label>
                    <div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password to verify"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 outline-none transition"
                      />
                    </div>
                  </div>
                )}

                {password && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Confirm New Password
                    </label>
                    <div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 outline-none transition"
                      />
                    </div>
                  </div>
                )}
              </div>

            </form>
          </div>

          {/* ৩. ড্রয়ার অ্যাকশন ফুটার */}
          <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="profile-settings-form"
              className="px-5 py-2 text-xs font-bold text-white bg-[#0e3b2e] hover:bg-[#134e3e] rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
            >
              Save Changes
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
