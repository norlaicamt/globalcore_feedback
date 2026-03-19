import React from "react";

export default function AnalyticsDashboard({ data }) {
  if (!data) return <div className="text-slate-400 italic">Synchronizing global data...</div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-slate-900"></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Reports</p>
          <p className="text-4xl font-black text-slate-900 mt-2">{data.total_feedback}</p>
        </div>

        {/* Status Breakdown Cards */}
        {Object.entries(data.by_status).map(([status, count]) => (
          <div key={status} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${status === 'OPEN' ? 'bg-amber-500' : 'bg-blue-600'}`}></div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{status} Issues</p>
            <p className="text-4xl font-black text-slate-900 mt-2">{count}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl">
        <h3 className="text-sm font-black uppercase tracking-widest text-blue-400 mb-6">Feedback Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(data.by_category).map(([cat, count]) => (
            <div key={cat} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <p className="text-[10px] font-bold text-slate-500 uppercase">{cat}</p>
              <p className="text-xl font-bold">{count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}