import { authFetch } from "./authFetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export const adminService = {
  // ১. ড্যাশবোর্ড পরিসংখ্যান
  async getStats() {
    const res = await authFetch(`${API_BASE_URL}/api/admin/stats`, {
      method: "GET",
    });
    if (!res.ok) throw new Error("Failed to load admin stats");
    return await res.json();
  },

  // ২. ৩৩ জন শিক্ষার্থীর তালিকা (র‍্যাংক, সিজিপিএ সহ)
  async getStudents() {
    const res = await authFetch(`${API_BASE_URL}/api/admin/students`, {
      method: "GET",
    });
    if (!res.ok) throw new Error("Failed to load students");
    return await res.json();
  },

  // ৩. শিক্ষার্থীর নির্দিষ্ট কোর্সের রেজাল্ট এডিট করা
  async editCourseGrade(studentId, { semesterId, courseCode, grade, gradePoint }) {
    const res = await authFetch(`${API_BASE_URL}/api/admin/students/${encodeURIComponent(studentId)}/course-grade`, {
      method: "PUT",
      body: JSON.stringify({ semesterId, courseCode, grade, gradePoint }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update course grade");
    return data;
  },

  // ৪. সকল ইউজারের তালিকা
  async getUsers() {
    const res = await authFetch(`${API_BASE_URL}/api/admin/users`, {
      method: "GET",
    });
    if (!res.ok) throw new Error("Failed to load users");
    return await res.json();
  },

  // ৫. অ্যাকাউন্ট সক্রিয় / নিষ্ক্রিয় (Enable / Disable)
  async toggleUserStatus(userId) {
    const res = await authFetch(`${API_BASE_URL}/api/admin/users/${userId}/toggle-status`, {
      method: "PUT",
    });
    if (!res.ok) throw new Error("Failed to toggle user status");
    return await res.json();
  },

  // ৬. ব্যাচ ক্লেইম অনুমোদন
  async approveBatchClaim(userId) {
    const res = await authFetch(`${API_BASE_URL}/api/admin/claims/${userId}/approve`, {
      method: "PUT",
    });
    if (!res.ok) throw new Error("Failed to approve batch claim");
    return await res.json();
  },

  // ৭. ব্যাচ ক্লেইম বাতিল
  async rejectBatchClaim(userId) {
    const res = await authFetch(`${API_BASE_URL}/api/admin/claims/${userId}/reject`, {
      method: "PUT",
    });
    if (!res.ok) throw new Error("Failed to reject batch claim");
    return await res.json();
  },

  // ৮. CR ক্লেইম অনুমোদন
  async approveCrClaim(userId) {
    const res = await authFetch(`${API_BASE_URL}/api/admin/claims/cr/${userId}/approve`, {
      method: "PUT",
    });
    if (!res.ok) throw new Error("Failed to approve CR claim");
    return await res.json();
  },

  // ৯. CR ক্লেইম বাতিল
  async rejectCrClaim(userId) {
    const res = await authFetch(`${API_BASE_URL}/api/admin/claims/cr/${userId}/reject`, {
      method: "PUT",
    });
    if (!res.ok) throw new Error("Failed to reject CR claim");
    return await res.json();
  },

  // ১০. সকল থটস ফেচ করা (ইউজার ও CR)
  async getThoughts() {
    const res = await authFetch(`${API_BASE_URL}/api/admin/thoughts`, {
      method: "GET",
    });
    if (!res.ok) return [];
    return await res.json();
  },

  // ১১. থট অনুমোদন (Allow)
  async approveThought(id) {
    const res = await authFetch(`${API_BASE_URL}/api/admin/thoughts/${id}/approve`, {
      method: "PUT",
    });
    if (!res.ok) throw new Error("Failed to approve thought");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("portal_batch_thoughts");
    }
    return await res.json();
  },

  // ১২. থট অননুমোদন (Disallow / Hide from Landing)
  async disallowThought(id) {
    const res = await authFetch(`${API_BASE_URL}/api/admin/thoughts/${id}/disallow`, {
      method: "PUT",
    });
    if (!res.ok) throw new Error("Failed to disallow thought");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("portal_batch_thoughts");
    }
    return await res.json();
  },

  // ১৩. থট ডিলিট
  async deleteThought(id) {
    const res = await authFetch(`${API_BASE_URL}/api/admin/thoughts/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete thought");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("portal_batch_thoughts");
    }
    return await res.json();
  },

  // ১৩. রোল পরিবর্তন
  async updateUserRole(userId, role) {
    const res = await authFetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error("Failed to update user role");
    return await res.json();
  },

  // ১৪. ইউজার ডিলিট
  async deleteUser(userId) {
    const res = await authFetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete user");
    return await res.json();
  },

  // ১৫. CR বক্তব্য ও মেয়াদ অনুমোদন
  async approveCrThought(userId) {
    const res = await authFetch(`${API_BASE_URL}/api/admin/cr-thoughts/${userId}/approve`, {
      method: "PUT",
    });
    if (!res.ok) throw new Error("Failed to approve CR story");
    return await res.json();
  },

  // ১৬. CR বক্তব্য ও মেয়াদ বাতিল
  async rejectCrThought(userId) {
    const res = await authFetch(`${API_BASE_URL}/api/admin/cr-thoughts/${userId}/reject`, {
      method: "PUT",
    });
    if (!res.ok) throw new Error("Failed to reject CR story");
    return await res.json();
  },

  // ১৭. ল্যান্ডিং পেজ ফটো কালেকশন ফেচ (Admin)
  async getLandingPhotos() {
    const res = await authFetch(`${API_BASE_URL}/api/admin/landing-photos`, {
      method: "GET",
    });
    if (!res.ok) return [];
    return await res.json();
  },

  // ১৮. ল্যান্ডিং পেজ নতুন ফটো যুক্ত করা
  async createLandingPhoto(data) {
    const res = await authFetch(`${API_BASE_URL}/api/admin/landing-photos`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.message || "Failed to create landing photo");
    return resData;
  },

  // ১৯. ল্যান্ডিং পেজ ফটো আপডেট
  async updateLandingPhoto(id, data) {
    const res = await authFetch(`${API_BASE_URL}/api/admin/landing-photos/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.message || "Failed to update landing photo");
    return resData;
  },

  // ২০. ল্যান্ডিং পেজ ফটো ডিলিট
  async deleteLandingPhoto(id) {
    const res = await authFetch(`${API_BASE_URL}/api/admin/landing-photos/${id}`, {
      method: "DELETE",
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.message || "Failed to delete landing photo");
    return resData;
  },
};
