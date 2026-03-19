import React from "react";

function FeedbackList({ feedbacks }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "OPEN": return "bg-amber-50 text-amber-700 border-amber-100";
      case "IN_PROGRESS": return "bg-blue-50 text-blue-700 border-blue-100";
      case "RESOLVED": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      default: return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  return (
    <div className="space-y-3">
      {feedbacks.map((f) => (
        <div key={f.id} className="group bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-400 transition-all flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{f.title}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-md border font-black tracking-tighter ${getStatusColor(f.status)}`}>
                {f.status}
              </span>
            </div>
            <p className="text-sm text-slate-500 line-clamp-1">{f.description}</p>
          </div>
          
          <div className="text-right flex flex-col items-end space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              ID: #GC-{f.id}
            </span>
            <button className="text-xs font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-900 hover:text-white transition-all">
              View Details
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FeedbackList;