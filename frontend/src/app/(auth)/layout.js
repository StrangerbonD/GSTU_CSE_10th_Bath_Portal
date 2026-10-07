export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between font-sans text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* ৩. সেন্টার্ড ফর্ম এরিয়া */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* ৪. আলাদা ও স্পষ্ট ফুটার */}
      <footer className="w-full bg-[#0f172a] text-slate-400 py-6 text-center text-sm font-medium border-t border-slate-800">
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