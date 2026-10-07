"use client";

import { useState, useRef, useEffect } from "react";

export default function AcademicsSection() {
  const [activeYear, setActiveYear] = useState(2023);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const lastTapRef = useRef(0);

  // গুগল ড্রাইভ লিংক (Academics Syllabus 2020-2021)
  const GOOGLE_DRIVE_SYLLABUS_LINK =
    "https://drive.google.com/file/d/1Y69jVtaq6vTU0NiVka-J-VM2wl2-hui1/view?usp=sharing";

  const calendarYears = [2022, 2023, 2024, 2025, 2026];

  const yearTitles = {
    2022: "1st Year (Session 2020-21)",
    2023: "2nd Year (Session 2020-21)",
    2024: "3rd Year (Session 2020-21)",
    2025: "4th Year (Session 2020-21)",
    2026: "Graduation & Wall Calendar",
  };

  // প্রতিটি বছরের অপটিমাইজড ও কম্প্রেসড ইমেজ ম্যাপ
  const calendarImageMap = {
    2022: "/images/calendars/calendar-2022.svg",
    2023: "/images/calendars/calendar-2023.webp",
    2024: "/images/calendars/calendar-2024.webp",
    2025: "/images/calendars/calendar-2025.webp",
    2026: "/images/calendars/calendar-2026.webp",
  };

  // ডাবল প্রেস বা ডাবল ক্লিক হ্যান্ডলার
  const handleDoublePress = () => {
    setIsFullScreen((prev) => !prev);
  };

  // মোবাইল টাচের জন্য ডাবল ট্যাপ ডিটেকশন
  const handleTouchEnd = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      handleDoublePress();
    }
    lastTapRef.current = now;
  };

  // Esc কি প্রেস করলে ফুলস্ক্রিন বন্ধ হবে
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsFullScreen(false);
      }
    };
    if (isFullScreen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullScreen]);

  return (
    <section id="academics" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full space-y-12">
      
      {/* ============================================================== */}
      {/* ১. উপরে: Academics Calendar                                   */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-slate-200/90 shadow-sm w-full">
        
        {/* ক্যালেন্ডার হেডার */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Academics Calendar
            </h3>
          </div>

          {/* ইয়ার লেভেল ব্যাজ */}
          <span className="self-start sm:self-auto px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold rounded-full">
            {yearTitles[activeYear]}
          </span>
        </div>

        {/* বছর সিলেক্টর বাটনসমূহ (2022 theke 2026) */}
        <div className="flex items-center gap-2.5 overflow-x-auto py-5 scrollbar-none">
          {calendarYears.map((yr) => (
            <button
              key={yr}
              onClick={() => setActiveYear(yr)}
              className={`px-5 py-2.5 rounded-xl text-sm sm:text-base font-bold transition cursor-pointer shrink-0 ${
                activeYear === yr
                  ? "bg-[#0e3b2e] text-white shadow-md scale-102"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              {yr}
            </button>
          ))}
        </div>

        {/* ============================================================== */}
        {/* ক্যালেন্ডার ইমেজ: পরিপাটি সাইজে শো করবে                         */}
        {/* ডাবল প্রেস / ডাবল ক্লিক করলে ফুল পেজ হবে                      */}
        {/* ============================================================== */}
        <div className="pt-2 w-full flex justify-center">
          <div
            onDoubleClick={handleDoublePress}
            onTouchEnd={handleTouchEnd}
            className="w-full max-w-3xl rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-50/70 shadow-xs flex flex-col items-center justify-center p-3 sm:p-5 cursor-pointer select-none group transition hover:border-emerald-300"
            title="Double-click to expand to fullscreen"
          >
            <img
              src={calendarImageMap[activeYear]}
              alt={`GSTU CSE Academic Calendar ${activeYear}`}
              className="max-h-[480px] sm:max-h-[520px] w-auto max-w-full object-contain rounded-xl transition duration-200 group-hover:scale-[1.01]"
              loading="lazy"
            />
            <p className="text-[11px] text-slate-400 mt-2.5 font-medium">
              Double-click image to expand to fullscreen
            </p>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* ২. নিচে: Academics Syllabus (2020-2021)                       */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-slate-200/90 shadow-sm w-full">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img
              src="/images/branding/syllabus_Icon.png"
              alt="Syllabus Icon"
              className="w-10 h-10 sm:w-11 sm:h-11 object-contain shrink-0"
            />
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Academics Syllabus
              </h3>
              <span className="inline-block mt-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                Session: 2020-2021
              </span>
            </div>
          </div>

          {/* গুগল ড্রাইভে যাওয়ার বাটন */}
          <a
            href={GOOGLE_DRIVE_SYLLABUS_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start md:self-auto py-3 px-6 bg-[#0e3b2e] hover:bg-[#134e3e] active:scale-95 text-white font-bold text-sm rounded-xl shadow-sm transition flex items-center gap-2 group cursor-pointer"
            title="Open Academics Syllabus (2020-2021) in Google Drive"
          >
            <span>📁</span>
            <span>Open Syllabus in Google Drive</span>
            <span className="text-emerald-300 group-hover:translate-x-0.5 transition">
              ↗
            </span>
          </a>
        </div>

        {/* সিলেবাস সারসংক্ষেপ কার্ড */}
        <div className="pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <h4 className="text-base font-bold text-slate-800">
              B.Sc. in Computer Science & Engineering Curriculum
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              The official curriculum and syllabus approved by the Departmental Academic Council for Session 2020-2021. Contains comprehensive course modules, credit allocations, prerequisite trees, sessional lab manuals, and evaluation criteria across all 8 semesters.
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-2.5">
            <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 text-center text-xs sm:text-sm">
              Total Credits: 161
            </div>
            <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-700 text-center text-xs sm:text-sm">
              Major Course : 131 Credits
            </div>
            <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-700 text-center text-xs sm:text-sm">
              Non-Major Course : 30 Credits
            </div>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* ৩. ফুলস্ক্রিন ভিউ (ডাবল প্রেস করলে ওপেন হবে)                  */}
      {/* ============================================================== */}
      {isFullScreen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-fadeIn"
          onClick={() => setIsFullScreen(false)}
        >
          {/* ক্লোজ বাটন */}
          <button
            onClick={() => setIsFullScreen(false)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl transition cursor-pointer select-none z-10"
            title="Close Fullscreen (Esc or Click outside)"
          >
            ✕
          </button>

          <div
            className="relative max-w-6xl max-h-[94vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={() => setIsFullScreen(false)}
            title="Double-click to exit fullscreen"
          >
            <img
              src={calendarImageMap[activeYear]}
              alt={`GSTU CSE Academic Calendar ${activeYear} Full`}
              className="max-h-[92vh] max-w-full w-auto object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}

    </section>
  );
}
