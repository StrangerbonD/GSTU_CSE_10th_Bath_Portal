const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

/**
 * ইউজার মিনিমাল সেশন কুকি সংরক্ষণ (SSR ও ইনস্ট্যান্ট রিফ্রেশ হাইড্রেশনের জন্য)
 */
export function saveUserMinCookie(user) {
  if (typeof document === "undefined" || !user) return;
  try {
    const v = user.avatarVersion ? `?v=${user.avatarVersion}` : "";
    let safeImage = user.image || user.avatarUrl || "";
    if (safeImage.startsWith("data:") || safeImage.length > 500) {
      safeImage = user.id ? `${API_BASE_URL}/api/users/${user.id}/avatar${v}` : "";
    } else if (user.id && safeImage.includes("/api/users/")) {
      safeImage = `${API_BASE_URL}/api/users/${user.id}/avatar${v}`;
    }
    const minData = {
      id: user.id,
      fullName: user.fullName || user.userName,
      userName: user.userName,
      image: safeImage,
      avatarUrl: safeImage,
      avatarVersion: user.avatarVersion,
      role: user.role,
      studentId: user.studentId || null,
      session: user.session || null,
      bloodGroup: user.bloodGroup || null,
      email: user.email || null,
      statusMessage: user.statusMessage || user.statusBadge || "Active Student",
      isVerifiedBatchStudent: Boolean(user.isVerifiedBatchStudent),
      claimStatus: user.claimStatus,
      isCr: Boolean(
        user.isCr === true ||
        user.crClaimStatus === "Approved" ||
        user.crClaimStatus === 2 ||
        user.crClaimStatus === "approved"
      ),
      crClaimStatus: user.crClaimStatus,
      crTenure: user.crTenure || null,
      crThought: user.crThought || null,
      pendingCrTenure: user.pendingCrTenure || null,
      pendingCrThought: user.pendingCrThought || null,
      crThoughtStatus: user.crThoughtStatus || "None",
    };
    document.cookie = `auth_user_min=${encodeURIComponent(JSON.stringify(minData))}; path=/; max-age=${30 * 24 * 3600}; SameSite=Lax`;
  } catch {}
}

export function clearUserMinCookie() {
  if (typeof document === "undefined") return;
  document.cookie = "auth_user_min=; path=/; max-age=0";
}

/**
 * ইউজারের সাবমিট করা থট কুকিতে সেভ করা (রিফ্রেশে ফ্লিকারিং প্রতিরোধ)
 */
export function saveUserThoughtCookie(thought) {
  if (typeof document === "undefined") return;
  try {
    if (!thought) {
      document.cookie = "auth_user_thought=; path=/; max-age=0";
    } else {
      const minThought = {
        id: thought.id,
        quote: thought.quote,
        isApproved: Boolean(thought.isApproved),
        createdAt: thought.createdAt || null,
        time: thought.time || "Recently",
      };
      document.cookie = `auth_user_thought=${encodeURIComponent(JSON.stringify(minThought))}; path=/; max-age=${30 * 24 * 3600}; SameSite=Lax`;
    }
  } catch {}
}

export function clearUserThoughtCookie() {
  if (typeof document === "undefined") return;
  document.cookie = "auth_user_thought=; path=/; max-age=0";
}

/**
 * অপ্রয়োজনীয় রি-রেন্ডার ও ফ্লিকার রোধে ইউজারের অর্থপূর্ণ ডাটা পরিবর্তন চেক
 */
export function hasUserChanged(prev, next) {
  if (!prev && !next) return false;
  if (!prev || !next) return true;
  return (
    prev.id !== next.id ||
    prev.fullName !== next.fullName ||
    prev.userName !== next.userName ||
    prev.email !== next.email ||
    prev.role !== next.role ||
    prev.isVerifiedBatchStudent !== next.isVerifiedBatchStudent ||
    prev.claimStatus !== next.claimStatus ||
    prev.studentId !== next.studentId ||
    prev.isCr !== next.isCr ||
    prev.crClaimStatus !== next.crClaimStatus ||
    prev.crTenure !== next.crTenure ||
    prev.crThought !== next.crThought ||
    prev.pendingCrTenure !== next.pendingCrTenure ||
    prev.pendingCrThought !== next.pendingCrThought ||
    prev.crThoughtStatus !== next.crThoughtStatus ||
    prev.image !== next.image ||
    prev.avatarUrl !== next.avatarUrl ||
    prev.avatarVersion !== next.avatarVersion
  );
}
