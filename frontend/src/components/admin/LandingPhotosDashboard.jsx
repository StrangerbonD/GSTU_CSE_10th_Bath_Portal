"use client";

import { useState, useEffect } from "react";
import { adminService } from "@/services/adminService";

export default function LandingPhotosDashboard({ onPhotosUpdated }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(null);

  // Form fields
  const [formData, setFormData] = useState({
    imageUrl: "",
    title: "",
    subtitle: "",
    badgeText: "Memories Forever",
    displayOrder: 1,
    isActive: true,
  });
  const [previewError, setPreviewError] = useState(false);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: "", message: "" }), 4000);
  };

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const data = await adminService.getLandingPhotos();
      setPhotos(Array.isArray(data) ? data : []);
      if (onPhotosUpdated && Array.isArray(data)) {
        onPhotosUpdated(data.length);
      }
    } catch (err) {
      console.error("Failed to load landing photos:", err);
      showFeedback("error", "Failed to load photos. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  const handleOpenAdd = () => {
    setEditingPhoto(null);
    setPreviewError(false);
    setFormData({
      imageUrl: "",
      title: "GSTU CSE 10th Batch Family",
      subtitle: "Department of Computer Science & Engineering",
      badgeText: "Memories Forever",
      displayOrder: photos.length + 1,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (photo) => {
    setEditingPhoto(photo);
    setPreviewError(false);
    setFormData({
      imageUrl: photo.imageUrl || "",
      title: photo.title || "",
      subtitle: photo.subtitle || "",
      badgeText: photo.badgeText || "Memories Forever",
      displayOrder: photo.displayOrder ?? 1,
      isActive: photo.isActive ?? true,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPhoto(null);
    setPreviewError(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.imageUrl.trim()) {
      showFeedback("error", "Image URL is required.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingPhoto) {
        await adminService.updateLandingPhoto(editingPhoto.id, {
          imageUrl: formData.imageUrl.trim(),
          title: formData.title.trim() || null,
          subtitle: formData.subtitle.trim() || null,
          badgeText: formData.badgeText.trim() || null,
          displayOrder: Number(formData.displayOrder) || 1,
          isActive: Boolean(formData.isActive),
        });
        showFeedback("success", "Photo updated successfully.");
      } else {
        await adminService.createLandingPhoto({
          imageUrl: formData.imageUrl.trim(),
          title: formData.title.trim() || null,
          subtitle: formData.subtitle.trim() || null,
          badgeText: formData.badgeText.trim() || null,
          displayOrder: Number(formData.displayOrder) || 1,
          isActive: Boolean(formData.isActive),
        });
        showFeedback("success", "New photo added successfully.");
      }

      handleCloseModal();
      await loadPhotos();
    } catch (err) {
      console.error("Save error:", err);
      showFeedback("error", err.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (photo) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this photo: "${photo.title || photo.imageUrl}"?`
    );
    if (!confirmDelete) return;

    try {
      await adminService.deleteLandingPhoto(photo.id);
      showFeedback("success", "Photo deleted successfully.");
      await loadPhotos();
    } catch (err) {
      console.error("Delete error:", err);
      showFeedback("error", err.message || "Failed to delete photo.");
    }
  };

  const handleToggleActive = async (photo) => {
    try {
      await adminService.updateLandingPhoto(photo.id, {
        ...photo,
        isActive: !photo.isActive,
      });
      showFeedback(
        "success",
        `Photo marked as ${!photo.isActive ? "Active" : "Inactive"}.`
      );
      await loadPhotos();
    } catch (err) {
      console.error("Toggle error:", err);
      showFeedback("error", "Failed to change status.");
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Landing page Photo collection
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage the rotating slideshow photos and descriptions shown on the main Home Page.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadPhotos}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Refresh
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-[#0e3b2e] hover:bg-[#09271e] text-white text-xs font-bold shadow-xs hover:shadow transition cursor-pointer"
          >
            Add New Photo
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback.message && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback({ type: "", message: "" })}
            className="text-xs font-bold underline cursor-pointer ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="py-16 text-center text-xs font-semibold text-slate-400">
          Loading photo collection...
        </div>
      ) : photos.length === 0 ? (
        <div className="py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8">
          <p className="text-sm font-bold text-slate-700">No photos in collection yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Click &quot;Add New Photo&quot; to seed your first slideshow memory photo.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 rounded-xl bg-[#0e3b2e] text-white text-xs font-bold cursor-pointer"
          >
            Add First Photo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border transition overflow-hidden flex flex-col ${
                item.isActive
                  ? "border-slate-200 bg-white hover:border-emerald-500/50 hover:shadow-md"
                  : "border-slate-200 bg-slate-50/70 opacity-75"
              }`}
            >
              {/* Image Thumbnail with Overlay Badges */}
              <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title || "Slideshow Photo"}
                  className="w-full h-full object-cover transition duration-300"
                  onError={(e) => {
                    e.target.src = "/images/landing/group-photo.jpg";
                  }}
                />
                
                {/* Badge text on top-left */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-bold text-white tracking-wide uppercase">
                  {item.badgeText || "Memories Forever"}
                </div>

                {/* Status indicator on top-right */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.isActive
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-600 text-slate-200"
                    }`}
                  >
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-slate-900">
                    Order: {item.displayOrder}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1">
                    {item.title || "No Title"}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                    {item.subtitle || "No Subtitle"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2 font-mono truncate" title={item.imageUrl}>
                    Source: {item.imageUrl}
                  </p>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleActive(item)}
                    className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                      item.isActive
                        ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                        : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    {item.isActive ? "Deactivate" : "Activate"}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 transition cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingPhoto ? "Update Landing Photo" : "Add New Landing Photo"}
                </h3>
                <p className="text-xs text-slate-500">
                  Fill in the details for this slideshow card photo.
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-md border border-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Image URL input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Image Path / URL *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. /images/landing/group-photo.jpg or https://..."
                  value={formData.imageUrl}
                  onChange={(e) => {
                    setFormData({ ...formData, imageUrl: e.target.value });
                    setPreviewError(false);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-[#0e3b2e] focus:ring-2 focus:ring-emerald-700/15"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  You can use local files (e.g. /images/landing/group-photo.jpg) or valid direct image URLs.
                </p>
                {formData.imageUrl.includes("ibb.co") && !formData.imageUrl.includes("i.ibb.co") && (
                  <p className="text-[11px] text-amber-600 mt-1 font-semibold">
                    💡 Tip: ImgBB এর ওয়েবপেজ লিংক নয়, Embed codes &gt; &quot;Direct links&quot; অপশন থেকে (যেমন: https://i.ibb.co.com/...jpg) লিংক কপি করুন।
                  </p>
                )}
              </div>

              {/* Live Preview */}
              {formData.imageUrl.trim() && (
                <div>
                  <span className="block text-[11px] font-bold text-slate-600 mb-1">
                    Live Preview
                  </span>
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className={`w-full h-full object-cover ${previewError ? "hidden" : "block"}`}
                      onError={() => {
                        setPreviewError(true);
                      }}
                      onLoad={() => {
                        setPreviewError(false);
                      }}
                    />

                    {previewError && (
                      <div className="p-4 text-center z-10">
                        <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm">
                          ✕
                        </div>
                        <p className="text-xs font-bold text-rose-300">ছবি লোড করা যায়নি</p>
                        <p className="text-[11px] text-slate-300 mt-1 max-w-xs leading-relaxed">
                          {formData.imageUrl.includes("ibb.co")
                            ? "এটি ImgBB এর ওয়েবপেজ লিংক। দয়া করে Direct Image Link দিন (যা .jpg বা .png দিয়ে শেষ হয়)।"
                            : "একটি সঠিক ডিরেক্ট ছবি লিঙ্ক (.jpg, .png) প্রদান করুন।"}
                        </p>
                      </div>
                    )}

                    {!previewError && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-[10px] font-bold text-white">
                        {formData.badgeText || "Memories Forever"}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GSTU CSE 10th Batch Family"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-[#0e3b2e]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Badge Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Memories Forever"
                    value={formData.badgeText}
                    onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-[#0e3b2e]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g. Department of Computer Science & Engineering"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-[#0e3b2e]"
                />
              </div>

              {/* Display Order & Active Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-[#0e3b2e]"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="isActiveCheckbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-700 cursor-pointer"
                  />
                  <label htmlFor="isActiveCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                    Show in Slideshow (Active)
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#0e3b2e] hover:bg-[#09271e] text-white text-xs font-bold shadow-xs hover:shadow disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Saving..." : editingPhoto ? "Update Photo" : "Add Photo"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
