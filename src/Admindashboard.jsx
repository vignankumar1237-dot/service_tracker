import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useAuth } from "./AuthContext";

export default function AdminDashboard({ onClose }) {
  const { shopData } = useAuth();
  const [allJobs, setAllJobs] = useState([]);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [activeTab, setActiveTab] = useState("overview"); // overview | history

  useEffect(() => {
    const q = query(
      collection(db, "shops", shopData.shopId, "jobs"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setAllJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [shopData.shopId]);

  const toDateObj = (ts) => {
    if (!ts) return new Date(0);
    return ts.toDate ? ts.toDate() : new Date(ts);
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const todayJobs = allJobs.filter((j) => {
    const d = toDateObj(j.createdAt).toISOString().split("T")[0];
    return d === todayStr;
  });

  const filteredJobs = allJobs.filter((j) => {
    const d = toDateObj(j.createdAt).toISOString().split("T")[0];
    return d >= fromDate && d <= toDate;
  });

  const totalDone = filteredJobs.filter((j) => j.status === 3).length;
  const totalActive = filteredJobs.filter((j) => j.status < 3).length;

  const todayDone = todayJobs.filter((j) => j.status === 3).length;
  const todayActive = todayJobs.filter((j) => j.status < 3).length;

  // Group history by date
  const jobsByDate = filteredJobs.reduce((acc, job) => {
    const d = toDateObj(job.createdAt).toISOString().split("T")[0];
    if (!acc[d]) acc[d] = [];
    acc[d].push(job);
    return acc;
  }, {});

  const sortedDates = Object.keys(jobsByDate).sort((a, b) => b.localeCompare(a));

  const STATUS_LABELS = ["Received", "Started", "In Progress", "Done ✓"];
  const STATUS_COLORS = [
    "text-slate-400",
    "text-blue-400",
    "text-amber-400",
    "text-green-400",
  ];

  const formatDate = (str) => {
    const d = new Date(str + "T00:00:00");
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (str === todayStr) return "Today";
    if (str === yesterday.toISOString().split("T")[0]) return "Yesterday";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const timeStr = (ts) => {
    if (!ts) return "";
    const d = toDateObj(ts);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8 bg-slate-950/95 backdrop-blur-md">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/8 text-slate-300"
        >
          ←
        </button>
        <div>
          <h2 className="font-bold text-white text-base">Admin Dashboard</h2>
          <p className="text-slate-500 text-xs">{shopData.shopName}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-5 pt-4 pb-2">
        {[
          { key: "overview", label: "📊 Overview" },
          { key: "history", label: "📅 History" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === key
                ? "bg-amber-400 text-slate-900"
                : "bg-white/6 text-slate-400 border border-white/8"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 pb-8">
        {activeTab === "overview" && (
          <>
            {/* Today stats */}
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Today</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/4 border border-white/8 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-bold text-white">{todayJobs.length}</p>
                  <p className="text-slate-500 text-xs mt-1">Total</p>
                </div>
                <div className="bg-blue-500/8 border border-blue-500/20 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-bold text-blue-400">{todayActive}</p>
                  <p className="text-slate-500 text-xs mt-1">Active</p>
                </div>
                <div className="bg-green-500/8 border border-green-500/20 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-400">{todayDone}</p>
                  <p className="text-slate-500 text-xs mt-1">Done</p>
                </div>
              </div>
            </div>

            {/* Date range filter */}
            <div className="bg-white/4 border border-white/8 rounded-2xl p-4 space-y-3">
              <p className="text-white text-sm font-semibold">Filter by Date Range</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 text-xs mb-1 block">From</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full bg-white/6 border border-white/12 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-amber-400/50"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
                <div>
                  <label className="text-slate-500 text-xs mb-1 block">To</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full bg-white/6 border border-white/12 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-amber-400/50"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
              </div>
            </div>

            {/* Range stats */}
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">
                {fromDate === toDate ? formatDate(fromDate) : `${formatDate(fromDate)} → ${formatDate(toDate)}`}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/4 border border-white/8 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-bold text-white">{filteredJobs.length}</p>
                  <p className="text-slate-500 text-xs mt-1">Total</p>
                </div>
                <div className="bg-blue-500/8 border border-blue-500/20 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-bold text-blue-400">{totalActive}</p>
                  <p className="text-slate-500 text-xs mt-1">Active</p>
                </div>
                <div className="bg-green-500/8 border border-green-500/20 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-400">{totalDone}</p>
                  <p className="text-slate-500 text-xs mt-1">Done</p>
                </div>
              </div>
            </div>

            {/* Staff breakdown (who added/updated most jobs) */}
            {filteredJobs.length > 0 && (() => {
              const staffCount = filteredJobs.reduce((acc, j) => {
                const key = j.addedBy || "Unknown";
                acc[key] = (acc[key] || 0) + 1;
                return acc;
              }, {});
              const entries = Object.entries(staffCount).sort((a, b) => b[1] - a[1]);
              if (entries.length <= 1) return null;
              return (
                <div>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">By Staff</p>
                  <div className="space-y-2">
                    {entries.map(([name, count]) => (
                      <div key={name} className="flex items-center justify-between bg-white/4 border border-white/8 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center text-xs font-bold text-amber-400">
                            {name[0]?.toUpperCase()}
                          </div>
                          <p className="text-white text-sm">{name}</p>
                        </div>
                        <span className="text-amber-400 font-bold text-sm">{count} jobs</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {activeTab === "history" && (
          <>
            {/* Date range for history */}
            <div className="bg-white/4 border border-white/8 rounded-2xl p-4 space-y-3">
              <p className="text-white text-sm font-semibold">Filter History</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 text-xs mb-1 block">From</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full bg-white/6 border border-white/12 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-amber-400/50"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
                <div>
                  <label className="text-slate-500 text-xs mb-1 block">To</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full bg-white/6 border border-white/12 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-amber-400/50"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
              </div>
            </div>

            {sortedDates.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-slate-400">No jobs in this date range</p>
              </div>
            ) : (
              sortedDates.map((dateStr) => (
                <div key={dateStr}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-semibold text-sm">{formatDate(dateStr)}</p>
                    <span className="text-slate-500 text-xs">
                      {jobsByDate[dateStr].length} jobs ·{" "}
                      {jobsByDate[dateStr].filter((j) => j.status === 3).length} done
                    </span>
                  </div>
                  <div className="space-y-2">
                    {jobsByDate[dateStr].map((job) => (
                      <div
                        key={job.id}
                        className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                          job.status === 3
                            ? "bg-green-500/5 border-green-500/15"
                            : "bg-white/4 border-white/8"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {job.image ? (
                            <img src={job.image} className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-lg">
                              🔧
                            </div>
                          )}
                          <div>
                            <p className="text-white text-sm font-medium">📱 {job.phone}</p>
                            <p className="text-slate-500 text-xs">
                              {timeStr(job.createdAt)}
                              {job.addedBy ? ` · ${job.addedBy}` : ""}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs font-semibold ${STATUS_COLORS[job.status]}`}>
                          {STATUS_LABELS[job.status]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}