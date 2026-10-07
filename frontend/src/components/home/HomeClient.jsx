"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { portalService } from "@/services/portalService";
import { authService } from "@/services/authService";

const DEFAULT_LANDING_PHOTOS = [
  {
    id: "default-photo-1",
    imageUrl: "/images/landing/group-photo.jpg",
    title: "GSTU CSE 10th Batch Family",
    subtitle: "Department of Computer Science & Engineering",
    badgeText: "Memories Forever",
    displayOrder: 1,
  },
];

const FALLBACK_THOUGHTS = [
  {
    id: "default-thought-1",
    name: "Bondhon",
    role: "GSTU CSE 10th Batch",
    time: "Just now",
    image:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=240&auto=format&fit=crop&q=80",
    quote:
      "Proud to be a part of GSTU CSE 10th Batch! These four years shaped who we are today. The late-night coding sessions, lab experiments, and campus laughter will remain in our hearts forever. Wishing endless success to all my batchmates!",
    isVerifiedBatchStudent: true,
  },
  {
    id: "default-thought-2",
    name: "Tanvir Ahmed",
    role: "GSTU CSE 10th Batch",
    time: "2 hours ago",
    image:
      "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=240&auto=format&fit=crop&q=80",
    quote:
      "CSE 10th batch wasn't just a university class; we were a family that stood together through every semester, tough lab exam, and hackathon. Looking forward to our grand batch reunion soon!",
    isVerifiedBatchStudent: true,
  },
  {
    id: "default-thought-3",
    name: "Sabbir Hossain",
    role: "GSTU CSE 10th Batch",
    time: "5 hours ago",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80",
    quote:
      "From our first 'Hello World' in C to our final year thesis defense, every single memory on this campus is truly priceless. Let's stay connected and keep supporting each other always.",
    isVerifiedBatchStudent: true,
  },
  {
    id: "default-thought-4",
    name: "Nafis Fuad",
    role: "GSTU CSE 10th Batch",
    time: "Yesterday at 9:15 PM",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80",
    quote:
      "The bonds we forged in GSTU CSE are unbreakable. So proud to see all of us growing into talented software engineers, researchers, and leaders across the industry. Keep shining, 10th batch!",
    isVerifiedBatchStudent: true,
  },
];

export default function HomeClient({
  initialRepresentatives = [],
  initialLandingPhotos = [],
  initialThoughts = [],
}) {
  // ১. ডাইনামিক ইউজার থটস স্টেট (সার্ভার প্রিফেচড অথবা ক্যাশড)
  const [thoughts, setThoughts] = useState(
    initialThoughts && initialThoughts.length > 0
      ? initialThoughts
      : FALLBACK_THOUGHTS
  );

  // ২. ক্লাস রিপ্রেজেনটেটিভস স্টেট (সার্ভার প্রপস দিয়ে ইনিশিয়ালাইজ করায় জিরো ফ্লিকার)
  const [representatives, setRepresentatives] = useState(initialRepresentatives);
  const [loadingReps, setLoadingReps] = useState(
    initialRepresentatives.length === 0
  );

  // ৩. ল্যান্ডিং ফটোজ স্টেট
  const [landingPhotos, setLandingPhotos] = useState(
    initialLandingPhotos && initialLandingPhotos.length > 0
      ? initialLandingPhotos
      : DEFAULT_LANDING_PHOTOS
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  const loadUser = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("auth_user");
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    }
  };

  useEffect(() => {
    loadUser();

    // ক্লায়েন্ট ব্যাকগ্রাউন্ড থটস রিভ্যালিডেশন
    portalService
      .getThoughts()
      .then((fresh) => {
        if (Array.isArray(fresh) && fresh.length > 0) {
          setThoughts(fresh);
        }
      })
      .catch(() => {});

    // রিপ্রেজেনটেটিভস ক্যাশ সিঙ্ক
    if (representatives.length > 0) {
      portalService.setRepresentativesCache?.(representatives);
    } else {
      const cached = portalService.getCachedRepresentatives();
      if (cached && cached.length > 0) {
        setRepresentatives(cached);
        setLoadingReps(false);
      } else {
        portalService
          .getRepresentatives()
          .then((fresh) => {
            if (Array.isArray(fresh) && fresh.length > 0) {
              setRepresentatives(fresh);
            }
          })
          .catch(() => {})
          .finally(() => setLoadingReps(false));
      }
    }

    // ব্যাকগ্রাউন্ড থেকে প্রোফাইল সিঙ্ক
    authService.syncCurrentUser();

    const handleUserUpdate = () => {
      loadUser();
    };

    window.addEventListener("auth_user_updated", handleUserUpdate);
    return () => window.removeEventListener("auth_user_updated", handleUserUpdate);
  }, [representatives.length]);

  // ৫ সেকেন্ড পর পর মেমোরিজ ফটো স্মুথলি রোটেট হবে
  useEffect(() => {
    if (landingPhotos.length <= 1) return;
    const photoTimer = setInterval(() => {
      setCurrentPhotoIdx((prev) => (prev + 1) % landingPhotos.length);
    }, 5000);

    return () => clearInterval(photoTimer);
  }, [landingPhotos.length]);

  // ৫ সেকেন্ড পর পর পরবর্তী ইউজারের কমেন্ট/থট স্মুথলি রিফ্রেশ হয়ে আসবে
  useEffect(() => {
    if (thoughts.length <= 1) return;

    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % thoughts.length);
        setFade(true);
      }, 250);
    }, 5000);

    return () => clearInterval(timer);
  }, [thoughts.length]);

  const currentThought =
    thoughts[currentIndex % thoughts.length] ||
    thoughts[0] ||
    FALLBACK_THOUGHTS[0];

  return (
    // মূল বডি: ক্লাসিক হালকা স্লেট / অফ-হোয়াইট ব্যাকগ্রাউন্ড (#f8fafc)
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between font-sans text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* ============================================================== */}
      {/* ২. পোর্টাল টাইটেল ও সাবটাইটেল সেকশন */}
      {/* ============================================================== */}
      <section className="text-center pt-8 pb-4 px-4">
        {/* টাইটেল ব্যাজ */}
        <div className="inline-flex items-center bg-white px-7 py-2 rounded-full border border-slate-200 shadow-xs mb-3">
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            GSTU CSE 10<sup>th</sup> Batch Portal
          </h1>
        </div>

        {/* সাবটাইটেল */}
        <div>
          <p className="text-lg sm:text-2xl font-bold text-[#c2410c] tracking-wide">
            WellCome To this Portal, Now Exploring
          </p>
        </div>
      </section>

      {/* ============================================================== */}
      {/* ৩. মূল বডি কন্টেন্ট গ্রিড: বামে কমেন্ট কার্ড, ডানে বড় ব্যাচ ফটো */}
      {/* ============================================================== */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* ------------------------------------------------------------ */}
          {/* বামপাশের কলাম: রোট্যাটিং ইউজার কমেন্ট কার্ড (৫ কলাম) */}
          {/* ------------------------------------------------------------ */}
          <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6 sm:p-8 flex items-center justify-center h-[460px] sm:h-[500px] lg:h-[520px] transition hover:shadow-md">
            <div
              className={`w-full flex flex-col sm:flex-row items-center sm:items-start gap-6 transition-opacity duration-300 ${
                fade ? "opacity-100" : "opacity-0"
              }`}
            >
              {/* ১. অবতার ও প্রোফাইল কলাম */}
              <div className="flex flex-col items-center text-center shrink-0 w-36 sm:w-40">
                {/* গোল প্রোফাইল ছবি: যে থট শেয়ার করেছে তার প্রোফাইল ছবি */}
                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-[#86efac] shadow-sm bg-slate-100 shrink-0">
                  <img
                    src={
                      currentThought.image ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        currentThought.name || "User"
                      )}&background=0e3b2e&color=fff`
                    }
                    alt={currentThought.name || "User"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        currentThought.name || "User"
                      )}&background=0e3b2e&color=fff`;
                    }}
                  />
                </div>

                {/* অবতারের নিচে নাম */}
                <h4 className="mt-3.5 font-bold text-slate-900 text-lg leading-tight">
                  {currentThought.name}
                </h4>

                {/* ব্যাচ পদবী: যদি সে GSTU CSE 10th Batch হিসেবে ভেরিফাইড/ক্লেইমড হয় তবেই শো করবে, না হলে কিছুই শো করবে না */}
                {currentThought.role && currentThought.role.trim() !== "" ? (
                  <p className="text-xs text-emerald-800 font-bold mt-1">
                    {currentThought.role}
                  </p>
                ) : null}

                {/* নামের নিচে টাইমস্ট্যাম্প: কখন শেয়ার করেছে সেই টাইম */}
                {currentThought.time && (
                  <p className="text-xs text-slate-400 font-medium mt-1 flex items-center justify-center gap-1.5">
                    <span>🕒</span> {currentThought.time}
                  </p>
                )}
              </div>

              {/* ২. কমেন্ট বাবল (কোনো স্ক্রোলিং নেই, মার্জিত ফন্ট) */}
              <div className="flex-1 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 sm:p-7 relative shadow-xs">
                {/* স্পিচ বাবল ট্রায়াঙ্গেল (ডেস্কটপে বামে পয়েন্ট করে) */}
                <div className="hidden sm:block absolute -left-2 top-8 w-4 h-4 bg-slate-50/70 border-l border-b border-slate-200/80 rotate-45"></div>

                <div className="text-3xl leading-none text-emerald-600/40 font-serif select-none mb-3">
                  “
                </div>

                <p className="text-slate-800 text-base sm:text-lg leading-relaxed italic font-serif">
                  {currentThought.quote}
                </p>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* ডানপাশের কলাম: বড় ব্যাচ ফটো কার্ড (৭ কলাম - ডাইনামিক স্লাইডশো) */}
          {/* ------------------------------------------------------------ */}
          <div className="lg:col-span-7 relative rounded-2xl overflow-hidden shadow-md border border-slate-200/90 bg-slate-950 h-[460px] sm:h-[500px] lg:h-[520px] group select-none">
            {/* ডাইনামিক স্ট্যাকড ইমেজ লেয়ার: স্মুথ ক্রস-ফেড এবং হোভার জুম-ইন / জুম-আউট */}
            {landingPhotos.map((item, idx) => (
              <div
                key={item.id || idx}
                className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                  idx === currentPhotoIdx
                    ? "opacity-100 z-10"
                    : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                {/* ব্যাকড্রপ ইমেজ ব্লার */}
                <img
                  src={item.imageUrl}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-30 brightness-75 pointer-events-none"
                />

                {/* মূল ইমেজ */}
                <img
                  src={item.imageUrl}
                  alt={item.title || "GSTU CSE 10th Batch Photo"}
                  className="absolute inset-0 w-full h-full object-cover object-center transform transition-transform duration-700 ease-out group-hover:scale-108"
                  onError={(e) => {
                    e.target.src = "/images/landing/group-photo.jpg";
                  }}
                />

                {/* ছবির নিচে ক্যাপশন ওভারলে */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent p-6 sm:p-8 text-white z-20 pointer-events-none">
                  <span className="inline-block text-[11px] uppercase tracking-wider font-bold text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-full mb-1.5 border border-emerald-500/30">
                    {item.badgeText || "Memories Forever"}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                    {item.title || "GSTU CSE 10th Batch Family"}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                    {item.subtitle || "Department of Computer Science & Engineering"}
                  </p>
                </div>
              </div>
            ))}

            {/* স্লাইডশো ইন্ডিকেটর */}
            {landingPhotos.length > 1 && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-full z-30 border border-white/10">
                {landingPhotos.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    onClick={() => setCurrentPhotoIdx(dotIdx)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      dotIdx === currentPhotoIdx
                        ? "w-6 bg-emerald-400"
                        : "w-2 bg-white/40 hover:bg-white/70"
                    }`}
                    title={`Slide ${dotIdx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ============================================================== */}
      {/* ৪. ক্লাস রিপ্রেজেন্টেটিভস সেকশন (About Class Representatives) */}
      {/* ============================================================== */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        {/* সেকশন হেডার ও ব্যাজ */}
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            About Class Representatives
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl mx-auto">
            Honoring the dedicated representatives who led and served the GSTU CSE
            10th Batch across each semester.
          </p>
        </div>

        {/* ক্লাস রিপ্রেজেন্টেটিভদের কার্ড (মাঝখান থেকে ডানে-বামে সারিবদ্ধ) */}
        {representatives.length > 0 ? (
          <div className="flex flex-wrap justify-center items-stretch gap-6">
            {representatives.map((cr) => (
              <div
                key={cr.id}
                className="w-full sm:w-[260px] md:w-[270px] lg:w-[280px] bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-300 flex flex-col items-center text-center group relative overflow-hidden"
              >
                {/* ১. গোল প্রোফাইল ছবি */}
                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-[#86efac]/50 shadow-sm bg-slate-100 group-hover:scale-105 group-hover:ring-[#86efac] transition duration-300 mb-3.5 shrink-0">
                  <img
                    src={
                      cr.image ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        cr.name
                      )}&background=0e3b2e&color=fff`
                    }
                    alt={cr.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        cr.name
                      )}&background=0e3b2e&color=fff`;
                    }}
                  />
                </div>

                {/* ২. নাম */}
                <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-emerald-800 transition">
                  {cr.name}
                </h3>

                {/* ৩. Duration */}
                <div className="mt-2">
                  <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-[11px] font-bold rounded-full">
                    {cr.tenure}
                  </span>
                </div>

                {/* ৪. Thought */}
                {cr.thought && (
                  <div className="mt-3.5 w-full bg-slate-50/90 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-700 italic leading-relaxed text-center font-serif flex-1 flex items-center justify-center">
                    &ldquo;{cr.thought}&rdquo;
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : loadingReps ? (
          <div className="flex flex-wrap justify-center items-stretch gap-6">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="w-full sm:w-[260px] md:w-[270px] lg:w-[280px] bg-white rounded-2xl p-6 border border-slate-200 animate-pulse flex flex-col items-center"
              >
                <div className="w-24 h-24 rounded-full bg-slate-200 mb-4"></div>
                <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
                <div className="h-3 w-20 bg-slate-100 rounded mb-4"></div>
                <div className="h-16 w-full bg-slate-50 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center max-w-lg mx-auto">
            <p className="text-sm font-semibold text-slate-600">
              No Class Representative showcase available yet.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Approved CR experiences and tenure stories will appear here once
              authorized by admin.
            </p>
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* ৫. ফুটার: ডিপ স্লেট চারকোল (#0f172a) */}
      {/* ============================================================== */}
      <footer className="w-full bg-[#0f172a] text-slate-400 py-6 text-center text-sm font-medium border-t border-slate-800 mt-8">
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
