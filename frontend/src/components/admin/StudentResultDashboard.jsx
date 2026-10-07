"use client";

export default function StudentResultDashboard({
  students = [],
  search = "",
  onSearchChange,
  onViewTranscript,
  onViewCertificate,
  onEditStudent,
}) {
  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.studentId?.toLowerCase().includes(q);
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Student Result Dashboard
          </h2>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by name or Roll (e.g. 20CSE016)..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-[#0e3b2e] focus:ring-2 focus:ring-emerald-700/15 transition"
          />
        </div>
      </div>

      {/* Students Leaderboard Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
              <th className="py-3.5 px-4 text-center">Rank</th>
              <th className="py-3.5 px-4">Roll Number</th>
              <th className="py-3.5 px-4">Student Name</th>
              <th className="py-3.5 px-4 text-center">Total Credits</th>
              <th className="py-3.5 px-4 text-center">CGPA</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.map((st) => (
              <tr key={st.studentId} className="hover:bg-emerald-50/40 transition">
                
                {/* Merit Rank */}
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`w-7 h-7 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                      st.meritRank === 1
                        ? "bg-amber-400 text-slate-950 ring-2 ring-amber-300 font-extrabold"
                        : st.meritRank === 2
                        ? "bg-slate-300 text-slate-900 font-bold"
                        : st.meritRank === 3
                        ? "bg-amber-700 text-white font-bold"
                        : "bg-slate-100 text-slate-600 font-semibold"
                    }`}
                  >
                    {st.meritRank}
                  </span>
                </td>

                {/* Roll */}
                <td className="py-3.5 px-4 font-mono font-bold text-emerald-950">
                  {st.studentId}
                </td>

                {/* Name */}
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  {st.name}
                </td>

                {/* Credits */}
                <td className="py-3.5 px-4 text-center font-semibold text-slate-600">
                  {st.totalCredits} Cr
                </td>

                {/* CGPA */}
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      st.cgpa >= 3.75
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        : st.cgpa >= 3.5
                        ? "bg-blue-100 text-blue-900 border border-blue-200"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {st.cgpa.toFixed(3)}
                  </span>
                </td>

                {/* Actions: Transcript, Certificate, Edit */}
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    
                    {/* Transcript */}
                    <button
                      onClick={() => onViewTranscript(st.studentId)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-xs transition cursor-pointer"
                      title="View full 8-semester official transcript"
                    >
                      Transcript
                    </button>

                    {/* Certificate */}
                    <button
                      onClick={() => onViewCertificate(st.studentId)}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs transition cursor-pointer"
                      title="View degree certificate"
                    >
                      Certificate
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => onEditStudent(st)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
                      title="Edit course result & recalculate GPA"
                    >
                      Edit
                    </button>

                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
