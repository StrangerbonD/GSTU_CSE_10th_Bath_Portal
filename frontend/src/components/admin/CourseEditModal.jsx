"use client";

import { useState, useEffect } from "react";
import { portalService } from "@/services/portalService";
import { adminService } from "@/services/adminService";

const GRADE_POINTS = {
  "A+": 4.00,
  "A": 3.75,
  "A-": 3.50,
  "B+": 3.25,
  "B": 3.00,
  "B-": 2.75,
  "C+": 2.50,
  "C": 2.25,
  "D": 2.00,
  "F": 0.00,
};

export default function CourseEditModal({ isOpen, onClose, student, onResultUpdated }) {
  const [selectedSemesterIdx, setSelectedSemesterIdx] = useState(0);
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingCourse, setUpdatingCourse] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  useEffect(() => {
    if (isOpen && student?.studentId) {
      loadTranscript();
    }
  }, [isOpen, student]);

  const loadTranscript = async () => {
    setLoading(true);
    setFeedback({ type: "", text: "" });
    try {
      const data = await portalService.getTranscript(student.studentId);
      setTranscript(data);
    } catch (err) {
      setFeedback({ type: "error", text: err.message || "Failed to load courses." });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !student) return null;

  const currentSemester = transcript?.semesters?.[selectedSemesterIdx];

  const handleGradeChange = async (courseCode, newGrade) => {
    const newPoint = GRADE_POINTS[newGrade] ?? 0.0;
    setUpdatingCourse(courseCode);
    setFeedback({ type: "", text: "" });

    // Semester ID is 1-indexed (1 to 8)
    const semesterId = selectedSemesterIdx + 1;

    try {
      await adminService.editCourseGrade(student.studentId, {
        semesterId: semesterId,
        courseCode: courseCode,
        grade: newGrade,
        gradePoint: newPoint,
      });

      setFeedback({
        type: "success",
        text: `Updated ${courseCode} to ${newGrade} (${newPoint.toFixed(2)})! Recalculated GPA in real-time.`,
      });

      // Reload fresh transcript
      await loadTranscript();
      if (onResultUpdated) onResultUpdated();
    } catch (err) {
      setFeedback({ type: "error", text: err.message || "Failed to update grade." });
    } finally {
      setUpdatingCourse(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Edit Student Academic Results</h3>
              <p className="text-xs text-emerald-200/80">
                {student.name} • <span className="font-mono font-bold text-amber-300">{student.studentId}</span>
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition text-xs font-bold"
            >
              ✕
            </button>
          </div>

          {/* Feedback banner */}
          {feedback.text && (
            <div
              className={`p-3 text-xs font-semibold px-6 flex items-center justify-between ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-b border-emerald-200"
                  : "bg-red-50 text-red-800 border-b border-red-200"
              }`}
            >
              <span>{feedback.text}</span>
              <button onClick={() => setFeedback({ type: "", text: "" })} className="opacity-70 hover:opacity-100">
                ✕
              </button>
            </div>
          )}

          {/* Semester Selector Tabs */}
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {transcript?.semesters?.map((sem, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedSemesterIdx(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedSemesterIdx === idx
                    ? "bg-emerald-800 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {sem.yearNumber}-{sem.semesterNumber} (GPA: {sem.gpa.toFixed(2)})
              </button>
            ))}
          </div>

          {/* Body: Course List */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                <p>Loading course results...</p>
              </div>
            ) : !currentSemester ? (
              <div className="py-12 text-center text-slate-400 text-sm">No courses found for this semester.</div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{currentSemester.semesterName}</h4>
                    <p className="text-[11px] text-slate-500">
                      Credits: {currentSemester.creditsSecured} / {currentSemester.creditsOffered} • GPA:{" "}
                      <span className="font-bold text-emerald-700">{currentSemester.gpa.toFixed(3)}</span>
                    </p>
                  </div>
                  <div className="text-xs text-slate-400 italic">
                    Select a new grade to update immediately
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  <div className="grid grid-cols-12 bg-slate-100/80 px-4 py-2.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <div className="col-span-3">Code</div>
                    <div className="col-span-5">Course Title</div>
                    <div className="col-span-2 text-center">Credit</div>
                    <div className="col-span-2 text-right">Grade</div>
                  </div>

                  {currentSemester.courses.map((course) => (
                    <div
                      key={course.courseCode}
                      className="grid grid-cols-12 px-4 py-3 items-center text-xs hover:bg-slate-50/80 transition"
                    >
                      <div className="col-span-3 font-mono font-bold text-slate-800">{course.courseCode}</div>
                      <div className="col-span-5 text-slate-700 truncate pr-2" title={course.courseTitle}>
                        {course.courseTitle}
                      </div>
                      <div className="col-span-2 text-center font-semibold text-slate-500">
                        {course.credits.toFixed(1)}
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-1.5">
                        {updatingCourse === course.courseCode ? (
                          <span className="text-[10px] text-emerald-700 animate-pulse font-bold">Saving...</span>
                        ) : (
                          <select
                            value={course.gradeLetter}
                            onChange={(e) => handleGradeChange(course.courseCode, e.target.value)}
                            className="bg-white border border-slate-300 font-bold text-slate-900 rounded-lg px-2 py-1 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                          >
                            {Object.keys(GRADE_POINTS).map((g) => (
                              <option key={g} value={g}>
                                {g} ({GRADE_POINTS[g].toFixed(2)})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 px-6">
            <span>Overall Batch CGPA recalculates automatically across the entire portal.</span>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition"
            >
              Done Editing
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
