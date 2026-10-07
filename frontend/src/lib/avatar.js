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
  if (u.id) {
    const v = u.avatarVersion ? `?v=${u.avatarVersion}` : "";
    return `${API_BASE_URL}/api/users/${u.id}/avatar${v}`;
  }
  if (u.image && !u.image.includes("photo-1535713875002")) {
    return u.image;
  }
  if (u.avatarUrl && !u.avatarUrl.includes("photo-1535713875002")) {
    return u.avatarUrl;
  }
  const name = u.fullName || u.userName || "User";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0e3b2e&color=fff`;
}
