import { clearPortalCache } from "./portalService.js";
import { saveUserMinCookie } from "../lib/authCookies.js";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// মেমরিতে এক্সেস টোকেন সংরক্ষণ (XSS প্রতিরোধ: localStorage-এ টোকেন রাখা হবে না)
let accessToken = null;
let refreshPromise = null;

// মাল্টিপল ট্যাব সিঙ্ক (BroadcastChannel)
let authChannel = null;
if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
  try {
    authChannel = new BroadcastChannel("gstu_auth_channel");
    authChannel.onmessage = (event) => {
      const { type, token } = event.data || {};
      if (type === "TOKEN_REFRESHED" && token) {
        accessToken = token;
      } else if (type === "LOGOUT") {
        accessToken = null;
        clearPortalCache();
        const path = window.location.pathname;
        const isProtected = path.startsWith("/dashboard") || path.startsWith("/admin");
        if (isProtected) {
          window.location.href = "/login?reason=session_expired";
        }
      }
    };
  } catch {}
}

export function broadcastLogout() {
  if (authChannel) {
    try {
      authChannel.postMessage({ type: "LOGOUT" });
    } catch {}
  }
}

export function getAccessToken() {
  if (accessToken) return accessToken;
  // মাইগ্রেশন বা প্রাথমিক বুটস্ট্র্যাপের জন্য লোকালস্টোরেজে থাকলে মেমরিতে তুলে লোকালস্টোরেজ থেকে মুছে ফেলা
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("jwt_token");
    if (stored) {
      accessToken = stored;
      localStorage.removeItem("jwt_token");
      return accessToken;
    }
  }
  return null;
}

export function setAccessToken(token) {
  accessToken = token || null;
  if (typeof window !== "undefined") {
    // লোকালস্টোরেজ থেকে সম্পূর্ণ মুছে মেমরি-অনলি রাখা
    localStorage.removeItem("jwt_token");
  }
}

export function clearAccessToken() {
  accessToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("jwt_token");
  }
}

/**
 * Single-flight Token Refresh:
 * একসাথে ৫টি রিকোয়েস্ট 401 পেলেও ব্যাকএন্ডে মাত্র ১টি /api/refresh-token কল যাবে।
 * বাকি সকল রিকোয়েস্ট একই Promise-এর জন্য অপেক্ষা করবে।
 */
export async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/refresh-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // HttpOnly রিফ্রেশ টোকেন কুকি স্বয়ংক্রিয়ভাবে যাবে
        });

        if (!res.ok) {
          throw new Error("refresh_failed");
        }

        const data = await res.json().catch(() => null);
        if (!data?.token) {
          throw new Error("refresh_failed");
        }

        // নতুন এক্সেস টোকেন মেমরিতে সংরক্ষণ
        setAccessToken(data.token);

        // অন্যান্য ট্যাবে ব্রডকাস্ট করা
        if (authChannel) {
          try {
            authChannel.postMessage({ type: "TOKEN_REFRESHED", token: data.token });
          } catch {}
        }

        if (data.user && typeof window !== "undefined") {
          const avatar = data.user.avatarUrl || data.user.image;
          const normalizedUser = {
            ...data.user,
            image: avatar,
            avatarUrl: avatar,
          };
          localStorage.setItem("auth_user", JSON.stringify(normalizedUser));
          document.cookie = `auth_session=true; path=/; max-age=${30 * 24 * 3600}; SameSite=Lax`;
          saveUserMinCookie(normalizedUser);
          window.dispatchEvent(new Event("auth_user_updated"));
        }

        return data.token;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

/**
 * Centralized Authenticated Fetch Wrapper
 * - মেমরি থেকে এক্সেস টোকেন Bearer হেডারে যুক্ত করে
 * - credentials: "include" নিশ্চিত করে
 * - FormData বডি হলে Content-Type ও বাউন্ডারি ব্রাউজারের হাতে ছেড়ে দেয়
 * - 401 Unauthorized পেলে single-flight পদ্ধতিতে স্বয়ংক্রিয় সাইলেন্ট রিফ্রেশ করে
 * - রিফ্রেশ সফল হলে আসল রিকোয়েস্টটি পুনরায় এক্সিকিউট করে
 * - রিফ্রেশ ব্যর্থ হলে নিরাপদভাবে সেশন মুছে ফেলে এবং লুপ ছাড়া রিডাইরেক্ট নিয়ন্ত্রণ করে
 */
export async function authFetch(url, options = {}, _retried = false) {
  let token = getAccessToken();

  // পেজ রিলোডে মেমরি খালি থাকলে কিন্তু ইউজার লগইন থাকলে আগে সাইলেন্ট রিফ্রেশ করার চেষ্টা
  if (!token && !_retried && typeof window !== "undefined" && localStorage.getItem("auth_user")) {
    try {
      token = await refreshAccessToken();
    } catch {
      // প্রাথমিক রিফ্রেশ ব্যর্থ হলে নিচের রিকোয়েস্ট চলতে দেওয়া এবং 401 হ্যান্ডল করা
    }
  }

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  // FormData হলে কোনো কাস্টম Content-Type মুছে ফেলা যাতে ব্রাউজার সঠিক boundary নির্ধারণ করতে পারে
  if (isFormData && headers["Content-Type"]) {
    delete headers["Content-Type"];
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status !== 401 || _retried) {
    return res;
  }

  // ৪০১ এরর: টোকেন রিফ্রেশ করে একবার রিট্রাই করা
  try {
    const newToken = await refreshAccessToken();
    if (!newToken) throw new Error("refresh_failed");
    return authFetch(url, options, true);
  } catch (err) {
    // সেশন পুরোপুরি শেষ: মেমরি ও লোকালস্টোরেজ ক্লিনআপ
    clearAccessToken();
    if (typeof window !== "undefined") {
      const wasLoggedIn = Boolean(localStorage.getItem("auth_user"));
      localStorage.removeItem("auth_user");
      document.cookie = "auth_session=; path=/; max-age=0";
      document.cookie = "user_role=; path=/; max-age=0";
      document.cookie = "auth_user_min=; path=/; max-age=0";
      clearPortalCache();
      broadcastLogout();
      window.dispatchEvent(new Event("auth_user_updated"));

      const path = window.location.pathname;
      const isAuthPage = path.startsWith("/login") || path.startsWith("/register") || path.startsWith("/verify-email");
      const isProtected = path.startsWith("/dashboard") || path.startsWith("/admin") || path.startsWith("/certificate") || path.startsWith("/transcript");

      // রিডাইরেক্ট লুপ প্রতিরোধ: ইউজার অথ পেজে থাকলে বা পাবলিক পেজে সাধারণ ভিজিটর হলে লগইনে পুশ করবে না
      if (!isAuthPage && (wasLoggedIn || isProtected)) {
        window.location.href = "/login?reason=session_expired";
      }
    }
    throw new Error("session_expired");
  }
}
