"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import StudentResultDashboard from "@/components/admin/StudentResultDashboard";
import UserDashboard from "@/components/admin/UserDashboard";
import ControlDashboard from "@/components/admin/ControlDashboard";
import LandingPhotosDashboard from "@/components/admin/LandingPhotosDashboard";
import TranscriptModal from "@/components/modals/TranscriptModal";
import CertificateModal from "@/components/modals/CertificateModal";
import CourseEditModal from "@/components/admin/CourseEditModal";
import { adminService } from "@/services/adminService";

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active Top Dashboard Tab: "students" | "users" | "control" | "landing_photos"
  const [activeTab, setActiveTab] = useState("students");

  // Control Dashboard Sub-Tab: "claims" | "cr_requests" | "cr_thoughts" | "user_thoughts"
  const [controlSubTab, setControlSubTab] = useState("claims");

  // Datasets
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [thoughts, setThoughts] = useState([]);
  const [photoCount, setPhotoCount] = useState(0);
  const [studentSearch, setStudentSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Modals state
  const [activeTranscriptId, setActiveTranscriptId] = useState(null);
  const [activeCertificateId, setActiveCertificateId] = useState(null);
  const [studentToEdit, setStudentToEdit] = useState(null);

  // Actions feedback
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState({ type: "", text: "" });

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: "", text: "" }), 4000);
  };

  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem("auth_user");
      if (!stored) {
        setLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
        if (parsed.role === "Admin") {
          await loadAllData();
        }
      } catch (e) {
        console.error("Auth check error:", e);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const loadAllData = async () => {
    try {
      const [statsData, studentsData, usersData, thoughtsData, photosData] = await Promise.all([
        adminService.getStats().catch(() => null),
        adminService.getStudents().catch(() => []),
        adminService.getUsers().catch(() => []),
        adminService.getThoughts().catch(() => []),
        adminService.getLandingPhotos().catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      if (studentsData) setStudents(studentsData);
      if (usersData) setUsers(usersData);
      if (thoughtsData) setThoughts(thoughtsData);
      if (Array.isArray(photosData)) setPhotoCount(photosData.length);
    } catch (err) {
      console.error("Error loading admin datasets:", err);
    }
  };

  const handleResultUpdated = async () => {
    try {
      const freshStudents = await adminService.getStudents();
      setStudents(freshStudents);
      showToast("success", "Student results and CGPA recalculated successfully.");
    } catch (e) {
      console.error(e);
    }
  };

  // User Actions
  const handleToggleUserStatus = async (userId, currentName) => {
    setActionLoading(`toggle-${userId}`);
    try {
      const updated = await adminService.toggleUserStatus(userId);
      showToast(
        "info",
        `Account for ${currentName} is now ${updated.isActive ? "Enabled" : "Disabled"}.`
      );
      await loadAllData();
    } catch (err) {
      showToast("error", err.message || "Failed to update account status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      showToast("success", `Role updated to ${newRole}`);
      await loadAllData();
    } catch (err) {
      showToast("error", err.message || "Failed to update role.");
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Are you sure you want to permanently delete user @${username}?`)) return;
    try {
      await adminService.deleteUser(userId);
      showToast("info", `User @${username} deleted.`);
      await loadAllData();
    } catch (err) {
      showToast("error", err.message || "Failed to delete user.");
    }
  };

  // Moderation Actions
  const handleApproveBatchClaim = async (userId, studentId) => {
    setActionLoading(`batch-app-${userId}`);
    try {
      await adminService.approveBatchClaim(userId);
      showToast("success", `Approved Roll ${studentId || ""} as recognized batch student.`);
      await loadAllData();
    } catch (err) {
      showToast("error", err.message || "Failed to approve claim.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectBatchClaim = async (userId) => {
    if (!confirm("Reject this batch identity claim?")) return;
    setActionLoading(`batch-rej-${userId}`);
    try {
      await adminService.rejectBatchClaim(userId);
      showToast("info", "Batch claim rejected.");
      await loadAllData();
    } catch (err) {
      showToast("error", err.message || "Failed to reject claim.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveCrClaim = async (userId, username) => {
    setActionLoading(`cr-app-${userId}`);
    try {
      await adminService.approveCrClaim(userId);
      showToast("success", `Approved @${username} as Class Representative.`);
      await loadAllData();
    } catch (err) {
      showToast("error", err.message || "Failed to approve CR claim.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectCrClaim = async (userId) => {
    if (!confirm("Reject this Class Representative claim?")) return;
    setActionLoading(`cr-rej-${userId}`);
    try {
      await adminService.rejectCrClaim(userId);
      showToast("info", "CR claim rejected.");
      await loadAllData();
    } catch (err) {
      showToast("error", err.message || "Failed to reject CR claim.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveThought = async (id) => {
    setActionLoading(`th-app-${id}`);
    try {
      await adminService.approveThought(id);
      showToast("success", "Thought allowed and now live on Landing Page!");
      await loadAllData();
    } catch (err) {
      showToast("error", err.message || "Failed to allow thought.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisallowThought = async (id) => {
    setActionLoading(`th-dis-${id}`);
    try {
      await adminService.disallowThought(id);
      showToast("info", "Thought disallowed and hidden from Landing Page.");
      await loadAllData();
    } catch (err) {
      showToast("error", err.message || "Failed to disallow thought.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteThought = async (id) => {
    if (!confirm("Delete this thought?")) return;
    try {
      await adminService.deleteThought(id);
      showToast("info", "Thought removed.");
      await loadAllData();
    } catch (err) {
      showToast("error", err.message || "Failed to remove thought.");
    }
  };

  const handleApproveCrThought = async (userId, fullName) => {
    setActionLoading(`cr-th-app-${userId}`);
    try {
      await adminService.approveCrThought(userId);
      showToast("success", `Approved CR story for ${fullName || "user"}. Live on Home Page!`);
      await loadAllData();
    } catch (err) {
      showToast("error", err.message || "Failed to approve CR story.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectCrThought = async (userId) => {
    if (!confirm("Reject this CR story / tenure request?")) return;
    setActionLoading(`cr-th-rej-${userId}`);
    try {
      await adminService.rejectCrThought(userId);
      showToast("info", "CR story request rejected.");
      await loadAllData();
    } catch (err) {
      showToast("error", err.message || "Failed to reject CR story.");
    } finally {
      setActionLoading(null);
    }
  };

  // Auth Guard Screen
  if (!loading && (!currentUser || currentUser.role !== "Admin")) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
        <div className="max-w-md mx-auto my-auto p-8 bg-white border border-slate-200 rounded-3xl shadow-xl text-center">
          <h2 className="text-2xl font-black text-slate-800">Admin Privileges Required</h2>
          <p className="text-sm text-slate-500 mt-2 mb-6">
            You must be logged in as an Administrator to access the Admin Dashboard.
          </p>
          <div className="flex flex-col gap-2.5">
            <Link
              href="/login"
              className="w-full py-3 bg-[#0e3b2e] hover:bg-[#134e3e] text-white font-bold rounded-xl text-sm transition"
            >
              Sign In as Admin
            </Link>
            <Link
              href="/"
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
        <footer className="w-full bg-[#0f172a] text-slate-400 py-6 text-center text-sm font-medium border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-slate-300 font-semibold">GSTU CSE 10<sup>th</sup> Batch Portal</p>
            <p className="text-slate-400 text-xs sm:text-sm">@strangerbond . All right reserved</p>
          </div>
        </footer>
      </div>
    );
  }

  const recognizedCount = users.filter((u) => u.isVerifiedBatchStudent).length;
  const pendingBatchClaimsCount = users.filter((u) => u.claimStatus === "Pending").length;
  const pendingCrClaimsCount = users.filter((u) => u.crClaimStatus === "Pending").length;
  const totalPending = pendingBatchClaimsCount + pendingCrClaimsCount;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      
      {/* 2. Admin Header: Tabs & Quick Metrics Bar */}
      <AdminHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        studentCount={students.length || 33}
        userCount={users.length}
        recognizedCount={recognizedCount}
        pendingCount={totalPending}
        photoCount={photoCount}
      />

      {/* 3. Main Dashboards Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 flex-1 space-y-6">

        {/* Toast Alert */}
        {toast.text && (
          <div
            className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between shadow-xs transition-all ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : toast.type === "error"
                ? "bg-red-50 border-red-300 text-red-900"
                : "bg-blue-50 border-blue-300 text-blue-900"
            }`}
          >
            <span>{toast.text}</span>
            <button
              onClick={() => setToast({ type: "", text: "" })}
              className="opacity-60 hover:opacity-100 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab 1: Student Result Dashboard */}
        {activeTab === "students" && (
          <StudentResultDashboard
            students={students}
            search={studentSearch}
            onSearchChange={setStudentSearch}
            onViewTranscript={setActiveTranscriptId}
            onViewCertificate={setActiveCertificateId}
            onEditStudent={setStudentToEdit}
          />
        )}

        {/* Tab 2: User Dashboard */}
        {activeTab === "users" && (
          <UserDashboard
            users={users}
            search={userSearch}
            onSearchChange={setUserSearch}
            onToggleStatus={handleToggleUserStatus}
            onRoleChange={handleRoleChange}
            onDeleteUser={handleDeleteUser}
            actionLoading={actionLoading}
          />
        )}

        {/* Tab 3: Control Dashboard */}
        {activeTab === "control" && (
          <ControlDashboard
            subTab={controlSubTab}
            onSubTabChange={setControlSubTab}
            users={users}
            thoughts={thoughts}
            onApproveBatchClaim={handleApproveBatchClaim}
            onRejectBatchClaim={handleRejectBatchClaim}
            onApproveCrClaim={handleApproveCrClaim}
            onRejectCrClaim={handleRejectCrClaim}
            onApproveCrThought={handleApproveCrThought}
            onRejectCrThought={handleRejectCrThought}
            onApproveThought={handleApproveThought}
            onDisallowThought={handleDisallowThought}
            onDeleteThought={handleDeleteThought}
            onRefresh={loadAllData}
            actionLoading={actionLoading}
          />
        )}

        {/* Tab 4: Landing page Photo collection */}
        {activeTab === "landing_photos" && (
          <LandingPhotosDashboard
            onPhotosUpdated={(count) => setPhotoCount(count)}
          />
        )}

      </main>

      {/* 4. Modals */}
      <TranscriptModal
        isOpen={!!activeTranscriptId}
        onClose={() => setActiveTranscriptId(null)}
        studentId={activeTranscriptId}
      />

      <CertificateModal
        isOpen={!!activeCertificateId}
        onClose={() => setActiveCertificateId(null)}
        studentId={activeCertificateId}
      />

      <CourseEditModal
        isOpen={!!studentToEdit}
        onClose={() => setStudentToEdit(null)}
        student={studentToEdit}
        onResultUpdated={handleResultUpdated}
      />

      {/* 5. Persistent Dark Footer */}
      <footer className="w-full bg-[#0f172a] text-slate-400 py-6 text-center text-sm font-medium border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-slate-300 font-semibold">
            GSTU CSE 10<sup>th</sup> Batch Portal
          </p>
          <p className="text-slate-400 text-xs sm:text-sm">
            @strangerbond . All right reserved
          </p>
        </div>
      </footer>

    </div>
  );
}
