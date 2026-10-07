"use client";

export default function ResourcesSection() {
  return (
    <section id="resources" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full">
      <div className="bg-white rounded-3xl p-8 sm:p-14 border border-slate-200/90 shadow-sm text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Semester Resources
        </h2>
        <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto">
          Academic routines and semester resources will be updated soon.
        </p>
        <div className="pt-2">
          <span className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full border border-emerald-200">
            Under Development
          </span>
        </div>
      </div>
    </section>
  );
}
