const STATUS_LABELS = ["Received", "Started", "In Progress", "Done ✓"];
const STATUS_COLORS = [
  "bg-slate-700 text-slate-300",
  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "bg-green-500/20 text-green-300 border-green-500/30",
];

export default function Item({ data, update, remove, isAdmin }) {
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

      {/* Vehicle/Item Image */}
      {data.image && (
        <div className="relative">
          <img src={data.image} className="w-full h-36 object-cover" />
          <div className={`absolute top-2 right-2 text-xs font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm ${STATUS_COLORS[data.status]}`}>
            {STATUS_LABELS[data.status]}
          </div>
        </div>
      )}

      <div className="p-3.5 space-y-3">

        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-lg flex-shrink-0">
              🔧
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm tracking-wide truncate">
                📱 {data.phone}
              </p>
              {data.serviceType && (
                <p className="text-amber-400/80 text-xs truncate">{data.serviceType}</p>
              )}
              <p className="text-slate-500 text-xs">
                {timeAgo(data.createdAt)}
                {data.addedBy ? ` · ${data.addedBy}` : ""}
              </p>
            </div>
          </div>

          {!data.image && (
            <div className={`text-xs font-bold px-2.5 py-1.5 rounded-full border flex-shrink-0 ${STATUS_COLORS[data.status]}`}>
              {STATUS_LABELS[data.status]}
            </div>
          )}
        </div>

        {/* Notes */}
        {data.notes ? (
          <p className="text-slate-400 text-xs bg-white/4 rounded-lg px-3 py-2 leading-relaxed">
            📝 {data.notes}
          </p>
        ) : null}

        {/* Progress bar */}
        <div className="flex items-center gap-1">
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
        <div className="grid grid-cols-3 gap-2">
          <button
            disabled={isDisabled(1)}
            onClick={() => handleClick(1)}
            className={`py-3 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              data.status >= 1
                ? "bg-blue-500 text-white"
                : isDisabled(1)
                ? "bg-white/5 text-slate-600 cursor-not-allowed"
                : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
            }`}
          >
            ▶ Start
          </button>

          <button
            disabled={isDisabled(2)}
            onClick={() => handleClick(2)}
            className={`py-3 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              data.status >= 2
                ? "bg-amber-500 text-white"
                : isDisabled(2)
                ? "bg-white/5 text-slate-600 cursor-not-allowed"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}
          >
            ⚙ Work
          </button>

          <button
            disabled={isDisabled(3)}
            onClick={() => handleClick(3)}
            className={`py-3 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              data.status >= 3
                ? "bg-green-500 text-white"
                : isDisabled(3)
                ? "bg-white/5 text-slate-600 cursor-not-allowed"
                : "bg-green-500/20 text-green-300 border border-green-500/30"
            }`}
          >
            ✓ Done
          </button>
        </div>

        {/* Delete — admin only */}
        {remove && (
          <button
            onClick={() => remove(data.id)}
            className="w-full py-2 rounded-xl border border-red-500/15 text-red-500/60 text-xs hover:bg-red-500/8 hover:text-red-400 transition-colors"
          >
            🗑 Remove Record
          </button>
        )}
      </div>
    </div>
  );
}