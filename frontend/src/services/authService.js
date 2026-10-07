import { clearPortalCache } from "./portalService";
import { setAccessToken, clearAccessToken, refreshAccessToken, authFetch, broadcastLogout } from "./authFetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

function extractErrorMessage(response, data, defaultMsg) {
  if (response?.status === 429) {
    return "Too many requests. Please wait a minute and try again.";
  }
  if (data?.message) return data.message;
  if (data?.title) return data.title;
  if (data?.detail) return data.detail;
  if (data?.errors && typeof data.errors === "object") {
    const firstKey = Object.keys(data.errors)[0];
    if (firstKey && Array.isArray(data.errors[firstKey]) && data.errors[firstKey].length > 0) {
      return data.errors[firstKey][0];
    }
  }
  return defaultMsg;
}

import {
  saveUserMinCookie,
  clearUserMinCookie,
  hasUserChanged,
} from "../lib/authCookies.js";

let isSyncingUser = false;
let lastSyncUserTimestamp = 0;
let activeRefreshPromise = null;

export const authService = {
  // ১. লগইন রিকোয়েস্ট (Facebook-style persistent cookie সহ)
  async login(userName, passWord) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Sends & receives HttpOnly refreshToken cookie
        body: JSON.stringify({
          username: userName,
          password: passWord,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          message: extractErrorMessage(response, data, "Invalid username or password"),
        };
      }

      if (data.token && typeof window !== "undefined") {
        setAccessToken(data.token);
        if (data.user) {
          const avatar = data.user.avatarUrl || data.user.image;
          const normalizedUser = {
            ...data.user,
            image: avatar,
            avatarUrl: avatar,
          };
          localStorage.setItem("auth_user", JSON.stringify(normalizedUser));
          if (normalizedUser.role) {
            document.cookie = `user_role=${normalizedUser.role}; path=/; max-age=${30 * 24 * 3600}; SameSite=Lax`;
          }
          saveUserMinCookie(normalizedUser);
        }
        document.cookie = `auth_session=true; path=/; max-age=${30 * 24 * 3600}; SameSite=Lax`;
        window.dispatchEvent(new Event("auth_user_updated"));
      }

      return {
        ...data,
        success: true,
      };
    } catch {
      return {
        success: false,
        message: "Unable to connect to server. Please try again.",
      };
    }
  },

  // ২. রেজিস্ট্রেশন রিকোয়েস্ট (Clean Architecture Backend + OTP Generation)
  async register({ username, fullName, email, password, studentId }) {
    try {
      const effectiveUsername = username?.trim() || email?.split("@")[0] || "user";
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: effectiveUsername,
          fullName: fullName?.trim() || effectiveUsername,
          email: email?.trim(),
          password: password,
          studentId: studentId?.trim() || null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          message: extractErrorMessage(response, data, "Registration failed"),
        };
      }

      return {
        ...data,
        success: true,
      };
    } catch {
      return {
        success: false,
        message: "Unable to connect to server. Please try again.",
      };
    }
  },

  // ৩. ইমেইল ভেরিফিকেশন রিকোয়েস্ট (৬-ডিজিট ওটিপি কোড সাবমিট)
  async verifyEmail(email, code) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email?.trim(),
          code: code?.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          message: extractErrorMessage(response, data, "Invalid or expired 6-digit verification code. Please request a new code."),
        };
      }

      if (data.token && typeof window !== "undefined") {
        setAccessToken(data.token);
        if (data.user) {
          const avatar = data.user.avatarUrl || data.user.image;
          const normalizedUser = {
            ...data.user,
            image: avatar,
            avatarUrl: avatar,
          };
          localStorage.setItem("auth_user", JSON.stringify(normalizedUser));
          if (normalizedUser.role) {
            document.cookie = `user_role=${normalizedUser.role}; path=/; max-age=${30 * 24 * 3600}; SameSite=Lax`;
          }
          saveUserMinCookie(normalizedUser);
        }
        document.cookie = `auth_session=true; path=/; max-age=${30 * 24 * 3600}; SameSite=Lax`;
        window.dispatchEvent(new Event("auth_user_updated"));
      }

      return {
        ...data,
        success: true,
      };
    } catch {
      return {
        success: false,
        message: "Unable to connect to server. Please try again.",
      };
    }
  },

  // ৪. রিসেন্ড ওটিপি রিকোয়েস্ট (নতুন কোড পাঠানোর জন্য)
  async resendOtp(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/resend-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email?.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        return {
          success: false,
          message: extractErrorMessage(response, data, "Failed to resend verification code"),
        };
      }

      return {
        ...data,
        success: true,
      };
    } catch {
      return {
        success: false,
        message: "Unable to connect to server. Please try again.",
      };
    }
  },

  // ৫. টোকেন রিফ্রেশ (Single-flight mutex দিয়ে concurrency race condition প্রতিরোধ)
  async refreshToken() {
    return refreshAccessToken().catch(() => null);
  },

  // ৬. লগআউট (রিমুভ কুকি ও সেশন)
  async logout() {
    try {
      await fetch(`${API_BASE_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignored
    } finally {
      clearAccessToken();
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_user");
        document.cookie = "auth_session=; path=/; max-age=0";
        document.cookie = "user_role=; path=/; max-age=0";
        clearUserMinCookie();
        clearPortalCache();
        broadcastLogout();
        window.dispatchEvent(new Event("auth_user_updated"));
      }
    }
  },

  // ৭. ইউজারের সর্বশেষ প্রোফাইল ফেচ ও সিঙ্ক করা (Safe with Throttling & Change-Detection)
  async syncCurrentUser(force = false) {
    try {
      if (typeof window === "undefined") return null;
      const now = Date.now();
      if (!force && (isSyncingUser || now - lastSyncUserTimestamp < 3000)) {
        const stored = localStorage.getItem("auth_user");
        return stored ? JSON.parse(stored) : null;
      }

      const stored = localStorage.getItem("auth_user");
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (!parsed?.id) return null;

      isSyncingUser = true;
      lastSyncUserTimestamp = now;

      const res = await authFetch(`${API_BASE_URL}/api/users/${parsed.id}`, {
        method: "GET",
      });

      if (!res.ok) return null;
      const freshUser = await res.json();
      if (freshUser) {
        let avatar = freshUser.avatarUrl || freshUser.image || parsed.avatarUrl || parsed.image;
        if (avatar && avatar.includes("photo-1535713875002")) {
          avatar = freshUser.avatarUrl && !freshUser.avatarUrl.includes("photo-1535713875002")
            ? freshUser.avatarUrl
            : `${API_BASE_URL}/api/users/${parsed.id}/avatar`;
        }
        const mergedUser = {
          ...parsed,
          ...freshUser,
          image: avatar,
          avatarUrl: avatar,
        };
        const newString = JSON.stringify(mergedUser);
        const currentString = localStorage.getItem("auth_user");

        const userChanged = hasUserChanged(parsed, mergedUser);
        if (userChanged) {
          localStorage.setItem("auth_user", newString);
          if (mergedUser.role) {
            document.cookie = `user_role=${mergedUser.role}; path=/; max-age=${30 * 24 * 3600}; SameSite=Lax`;
          }
          saveUserMinCookie(mergedUser);
          window.dispatchEvent(new Event("auth_user_updated"));
        }
        return mergedUser;
      }
      return null;
    } catch {
      return null;
    } finally {
      isSyncingUser = false;
    }
  },

  saveUserMinCookie,
};