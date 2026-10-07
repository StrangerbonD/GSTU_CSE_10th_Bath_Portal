import { authFetch } from "./authFetch.js";
import {
  saveUserThoughtCookie,
  clearUserThoughtCookie,
} from "../lib/authCookies.js";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

const memoryCache = new Map();

function getCurrentUserId() {
  if (typeof window === "undefined") return "anon";
  try {
    const stored = localStorage.getItem("auth_user");
    if (stored) {
      const u = JSON.parse(stored);
      return u?.id || "anon";
    }
  } catch {}
  return "anon";
}

function getCache(key, maxAgeMs = 120000) {
  // Never cache or share across SSR server requests
  if (typeof window === "undefined") return null;
  const item = memoryCache.get(key);
  if (item) {
    if (Date.now() - item.timestamp <= maxAgeMs) {
      return item.data;
    }
    memoryCache.delete(key);
  }
  // Try sessionStorage for instant page reload / refresh recovery
  try {
    const raw = sessionStorage.getItem(`portal_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp <= maxAgeMs) {
        memoryCache.set(key, parsed);
        return parsed.data;
      }
      sessionStorage.removeItem(`portal_${key}`);
    }
  } catch {}
  return null;
}

function setCache(key, data) {
  if (typeof window === "undefined") return;
  const entry = { data, timestamp: Date.now() };
  memoryCache.set(key, entry);
  try {
    sessionStorage.setItem(`portal_${key}`, JSON.stringify(entry));
  } catch {}
}

export function clearPortalCache() {
  if (typeof window !== "undefined") {
    memoryCache.clear();
    try {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith("portal_")) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch {}
  }
}

export const portalService = {
  clearCache: clearPortalCache,

  getCachedStatistics() {
    return getCache("statistics");
  },
  getCachedRepresentatives() {
    return getCache("representatives");
  },
  setRepresentativesCache(data) {
    if (Array.isArray(data)) {
      setCache("representatives", data);
    }
  },
  getCachedLandingPhotos() {
    return getCache("landing_photos");
  },
  setLandingPhotosCache(data) {
    if (Array.isArray(data)) {
      setCache("landing_photos", data);
    }
  },
  getCachedThoughts() {
    return getCache("batch_thoughts");
  },
  setThoughtsCache(data) {
    if (Array.isArray(data)) {
      setCache("batch_thoughts", data);
    }
  },
  getCachedTranscript(studentId) {
    if (!studentId?.trim()) return null;
    const userId = getCurrentUserId();
    return getCache(`transcript_${userId}_${studentId.trim().toUpperCase()}`);
  },
  getCachedCertificate(studentId) {
    if (!studentId?.trim()) return null;
    const id = studentId.trim().toUpperCase();
    return getCache(`cert_${id}`) || getCache(`verify_${id}`);
  },

  // ১. স্টুডেন্ট রেজাল্ট ও ট্রান্সক্রিপ্ট ফেচ করা (8 Semesters with Courses)
  async getTranscript(studentId) {
    const id = studentId?.trim();
    if (!id) {
      throw new Error("Student ID is required to fetch transcript.");
    }
    const userId = getCurrentUserId();
    const cacheKey = `transcript_${userId}_${id.toUpperCase()}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;
    try {
      const response = await authFetch(`${API_BASE_URL}/api/students/${encodeURIComponent(id)}/transcript`, {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          throw new Error(errorData.message || `No transcript record found for Student ID: ${id}`);
        }
        throw new Error(errorData.message || `Failed to load transcript for Student ID: ${id} (${response.status})`);
      }

      const result = await response.json();
      setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.warn("portalService getTranscript Warning:", error.message);
      throw error;
    }
  },

  // ২. প্রভিশনাল সার্টিফিকেট ও ডিগ্রি ভেরিফিকেশন ফেচ করা
  async verifyStudent(studentId) {
    const id = studentId?.trim();
    if (!id) {
      throw new Error("Student ID is required to verify certificate.");
    }
    const cacheKey = "verify_" + id.toUpperCase();
    const cached = getCache(cacheKey);
    if (cached) return cached;
    try {
      const response = await authFetch(`${API_BASE_URL}/api/students/verify/${encodeURIComponent(id)}`, {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Student not verified: ${id}`);
      }

      const result = await response.json();
      setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error("portalService verifyStudent Error:", error);
      throw error;
    }
  },

  // ২.১ অফিশিয়াল প্রভিশনাল সার্টিফিকেট ফেচ করা (Ownership Protected)
  async getCertificate(studentId) {
    const id = studentId?.trim();
    if (!id) {
      throw new Error("Student ID is required to load certificate.");
    }
    const cacheKey = "cert_" + id.toUpperCase();
    const cached = getCache(cacheKey);
    if (cached) return cached;
    try {
      const response = await authFetch(`${API_BASE_URL}/api/students/${encodeURIComponent(id)}/certificate`, {
        method: "GET",
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied: You are only authorized to view your own confidential certificate.");
        }
        if (response.status === 401) {
          throw new Error("Authentication required to view academic certificate.");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to load certificate for ${id}`);
      }

      const result = await response.json();
      setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.warn("portalService getCertificate Warning:", error.message);
      throw error;
    }
  },

  // ৩. ব্যাচ স্ট্যাটিস্টিকস ও মেরিট লিডারবোর্ড ফেচ করা (পাবলিক ও দ্রুত ক্যাশড)
  async getStatistics(forceFresh = false) {
    const cacheKey = "statistics";
    if (!forceFresh) {
      const cached = getCache(cacheKey);
      if (cached) return cached;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/statistics`, {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to load batch statistics");
      }

      const result = await response.json();
      setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.warn("portalService getStatistics Notice:", error.message);
      throw error;
    }
  },

  // ৪. ব্যাচমেট ক্লেইম সাবমিশন
  async submitClaim(userId, studentId, recognitionNote) {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/claims`, {
        method: "POST",
        body: JSON.stringify({
          userId: userId,
          studentId: studentId?.trim(),
          recognitionNote: recognitionNote?.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to submit claim request");
      }

      return data;
    } catch (error) {
      console.error("portalService submitClaim Error:", error);
      throw error;
    }
  },

  // ৫. প্রোফাইল আপডেট (নাম, ছবি, পাসওয়ার্ড)
  async updateProfile(userId, { fullName, avatarUrl, newPassword }) {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/users/${userId}/profile`, {
        method: "PUT",
        body: JSON.stringify({
          fullName: fullName?.trim(),
          avatarUrl: avatarUrl || null,
          newPassword: newPassword || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      return data;
    } catch (error) {
      console.error("portalService updateProfile Error:", error);
      throw error;
    }
  },

  // ৬. স্ট্যাটাস মেসেজ আপডেট
  async updateStatus(userId, statusMessage) {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/users/${userId}/status`, {
        method: "PUT",
        body: JSON.stringify({
          statusMessage: statusMessage?.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update status message");
      }

      return data;
    } catch (error) {
      console.error("portalService updateStatus Error:", error);
      throw error;
    }
  },

  // ৭. থটস / উক্তি ফেচ করা (হোমপেজ কমেন্ট বাবলের জন্য)
  async getThoughts() {
    const cached = getCache("batch_thoughts");
    if (cached) return cached;
    try {
      const response = await fetch(`${API_BASE_URL}/api/thoughts`, {
        method: "GET",
      });

      if (!response.ok) {
        return [];
      }

      const result = await response.json();
      setCache("batch_thoughts", result);
      return result;
    } catch (error) {
      console.warn("portalService getThoughts Warning:", error.message);
      return [];
    }
  },

  // ৮. নতুন থট পোস্ট করা (ড্যাশবোর্ড থেকে)
  async createThought(quote) {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/thoughts`, {
        method: "POST",
        body: JSON.stringify({ quote: quote?.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to post thought");
      }

      // ক্যাশ ক্লিয়ার করা যাতে সাথে সাথে নতুন কমেন্ট দৃশ্যমান হয়
      memoryCache.delete("batch_thoughts");
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("portal_batch_thoughts");
      }

      saveUserThoughtCookie(data);
      return data;
    } catch (error) {
      console.error("portalService createThought Error:", error);
      throw error;
    }
  },

  // ৮.১ ইউজারের নিজের সাবমিট করা থট রিট্রিভ করা
  async getMyThought() {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/thoughts/my-thought`, {
        method: "GET",
      });
      if (!response.ok) {
        if (response.status === 404) {
          clearUserThoughtCookie();
        }
        return null;
      }
      const data = await response.json();
      saveUserThoughtCookie(data);
      return data;
    } catch (error) {
      console.warn("portalService getMyThought Error:", error);
      return null;
    }
  },

  // ৮.২ ইউজারের নিজের থট ডিলিট করা
  async deleteMyThought() {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/thoughts/my-thought`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete thought");

      memoryCache.delete("batch_thoughts");
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("portal_batch_thoughts");
      }
      clearUserThoughtCookie();
      return await response.json();
    } catch (error) {
      console.error("portalService deleteMyThought Error:", error);
      throw error;
    }
  },

  // ৯. ক্লাস রিপ্রেজেনটেটিভ (CR) লিস্ট ফেচ করা
  async getRepresentatives() {
    const cached = getCache("representatives");
    if (cached) return cached;
    try {
      const response = await authFetch(`${API_BASE_URL}/api/representatives`, {
        method: "GET",
      });

      if (!response.ok) {
        return [];
      }

      const result = await response.json();
      setCache("representatives", result);
      return result;
    } catch (error) {
      console.warn("portalService getRepresentatives Warning:", error);
      return [];
    }
  },

  // ১০. CR ক্লেইম সাবমিট করা
  async submitCrClaim(userId, crClaimNote) {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/claims/cr`, {
        method: "POST",
        body: JSON.stringify({
          userId: userId,
          note: crClaimNote?.trim(),
          crClaimNote: crClaimNote?.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to submit CR claim request");
      }

      return data;
    } catch (error) {
      console.error("portalService submitCrClaim Error:", error);
      throw error;
    }
  },

  // ১১. CR প্রোফাইল আপডেট (মেয়াদ ও বক্তব্য)
  async updateCrProfile(userId, { crTenure, crThought }) {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/users/${userId}/cr-profile`, {
        method: "PUT",
        body: JSON.stringify({
          crTenure: crTenure?.trim(),
          crThought: crThought?.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update CR profile");
      }

      return data;
    } catch (error) {
      console.error("portalService updateCrProfile Error:", error);
      throw error;
    }
  },

  // ১২. CR বক্তব্য ও মেয়াদের রিকোয়েস্ট সাবমিট করা (এডমিন অনুমোদনের জন্য)
  async submitCrThought(userId, { tenure, thought }) {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/users/${userId}/cr-thought`, {
        method: "POST",
        body: JSON.stringify({
          tenure: tenure?.trim(),
          thought: thought?.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to submit CR story request");
      }

      return data;
    } catch (error) {
      console.error("portalService submitCrThought Error:", error);
      throw error;
    }
  },

  // ১৩. ল্যান্ডিং পেজের ফটো কালেকশন ফেচ করা (স্মুথ স্লাইডশো)
  async getLandingPhotos() {
    const cached = getCache("landing_photos");
    if (cached) return cached;
    try {
      const response = await authFetch(`${API_BASE_URL}/api/landing-photos`, {
        method: "GET",
      });

      if (!response.ok) {
        return [];
      }

      const result = await response.json();
      setCache("landing_photos", result);
      return result;
    } catch (error) {
      console.warn("portalService getLandingPhotos Warning:", error.message);
      return [];
    }
  },
};
