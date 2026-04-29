const STATUS_LABELS = ["Received", "Started", "In Progress", "Ready ✓"];
const STATUS_COLORS = [
  "bg-slate-700 text-slate-300",
  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "bg-green-500/20 text-green-300 border-green-500/30",
];

export default function Item({ data, update, remove, shopName }) {
  const isDisabled = (step) => {
    if (data.status === 0) return step !== 1;
    if (data.status === 1) return false;
    if (data.status === 2) return step !== 3;
    if (data.status === 3) return true;
  };

  const handleClick = (step) => {
    let finalStep = step;
    if (data.status === 1 && step === 3) finalStep = 3;
    update(data.id, finalStep, data.phone);
  };

  const timeAgo = (ts) => {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      data.status === 3
        ? "bg-green-500/5 border-green-500/20"
        : "bg-white/4 border-white/10"
    }`}>

      {/* Vehicle Image */}
      {data.image && (
        <div className="relative">
          <img
            src={data.image}
            className="w-full h-40 object-cover"
          />
          {/* Status badge on image */}
          <div className={`absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full border backdrop-blur-sm ${STATUS_COLORS[data.status]}`}>
            {STATUS_LABELS[data.status]}
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">

        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-11 h-11 rounded-xl bg-slate-700 flex items-center justify-center text-xl flex-shrink-0">
              🚗
            </div>
            <div>
              <p className="text-white font-bold text-base tracking-wide">
                📱 {data.phone}
              </p>
              <p className="text-slate-500 text-xs mt-0.5">{timeAgo(data.createdAt)}</p>
            </div>
          </div>

          {/* Status badge (when no image) */}
          {!data.image && (
            <div className={`text-xs font-bold px-3 py-1.5 rounded-full border ${STATUS_COLORS[data.status]}`}>
              {STATUS_LABELS[data.status]}
            </div>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                data.status >= i ? "bg-amber-400" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            disabled={isDisabled(1)}
            onClick={() => handleClick(1)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              data.status >= 1
                ? "bg-blue-500 text-white"
                : isDisabled(1)
                ? "bg-white/5 text-slate-600 cursor-not-allowed"
                : "bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30"
            }`}
          >
            ▶ Start
          </button>

          <button
            disabled={isDisabled(2)}
            onClick={() => handleClick(2)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              data.status >= 2
                ? "bg-amber-500 text-white"
                : isDisabled(2)
                ? "bg-white/5 text-slate-600 cursor-not-allowed"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
            }`}
          >
            ⚙ Work
          </button>

          <button
            disabled={isDisabled(3)}
            onClick={() => handleClick(3)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              data.status >= 3
                ? "bg-green-500 text-white"
                : isDisabled(3)
                ? "bg-white/5 text-slate-600 cursor-not-allowed"
                : "bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30"
            }`}
          >
            ✓ Done
          </button>
        </div>

        {/* Delete */}
        <button
          onClick={() => remove(data.id)}
          className="w-full py-2 rounded-xl border border-red-500/15 text-red-500/60 text-xs hover:bg-red-500/8 hover:text-red-400 transition-colors"
        >
          🗑 Remove Record
        </button>
      </div>
    </div>
  );
}
