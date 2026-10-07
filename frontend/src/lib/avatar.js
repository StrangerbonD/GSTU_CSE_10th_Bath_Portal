const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

/**
 * Resolves a student/user avatar URL with support for:
 * 1. Uploaded backend avatars with cache-busting version query (?v=timestamp)
 * 2. External avatar URLs (Unsplash, etc.)
 * 3. Default fallback SVG/UI-Avatars with initials
 *
 * @param {Object|null} u User or student object
 * @returns {string} Fully qualified image URL
 */
export function getUserAvatar(u) {
  if (!u) {
    return "https://ui-avatars.com/api/?name=User&background=0e3b2e&color=fff";
  }

  // 1. Direct Base64 Data URL (Fastest, instant rendering, zero network delay)
  const candidate = u.avatarUrl || u.image;
  if (candidate && typeof candidate === "string" && candidate.trim() !== "") {
    const trimmed = candidate.trim();
    if (trimmed.startsWith("data:image/")) {
      return trimmed;
    }
    // Direct external image URLs (ImgBB, Unsplash, Cloudinary, etc.)
    if (
      (trimmed.startsWith("http://") || trimmed.startsWith("https://")) &&
      !trimmed.includes("photo-1535713875002") &&
      !trimmed.includes("/api/users/")
    ) {
      return trimmed;
    }
  }

  // 2. Backend hosted / avatar proxy with cache-busting
  if (u.id) {
    const v = u.avatarVersion || (u.updatedAt ? new Date(u.updatedAt).getTime() : Date.now());
    return `${API_BASE_URL}/api/users/${u.id}/avatar?v=${v}`;
  }

  const name = u.fullName || u.userName || "User";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0e3b2e&color=fff`;
}
