import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "./firebase";
import { doc, onSnapshot, getDoc, updateDoc } from "firebase/firestore";

const STEPS = ["Received", "In Progress", "Almost Done", "Ready! 🎉"];

export default function Track() {
  const { id, shopId } = useParams();
  const decodedShop = decodeURIComponent(shopId);

  const [data, setData] = useState(null);
  const [shopInfo, setShopInfo] = useState(null);
  const [responding, setResponding] = useState(false);
  const [responseMsgs, setResponseMsgs] = useState({}); // { [index]: message }

  // Fetch shop info once
  useEffect(() => {
    if (!decodedShop) return;
    getDoc(doc(db, "shops", decodedShop)).then((snap) => {
      if (snap.exists()) setShopInfo(snap.data());
    });
  }, [decodedShop]);

  // Live job tracking
  useEffect(() => {
    if (!decodedShop || !id) return;
    const ref = doc(db, "shops", decodedShop, "jobs", id);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setData(snap.data());
    });
    return () => unsub();
  }, [id, decodedShop]);

  const respondToPartRequest = async (pendingIndex, decision) => {
    setResponding(true);
    try {
      const updatedRequests = [...(data.partRequests || [])];
      updatedRequests[pendingIndex] = {
        ...updatedRequests[pendingIndex],
        status: decision,
        respondedAt: new Date().toISOString(),
      };
      await updateDoc(doc(db, "shops", decodedShop, "jobs", id), {
        partRequests: updatedRequests,
      });

      const msg = decision === "approved"
        ? "✅ Approved! The mechanic will proceed."
        : "❌ Rejected. The shop will contact you shortly.";
      setResponseMsgs(prev => ({ ...prev, [pendingIndex]: msg }));
    } catch (e) {
      alert("Something went wrong. Please try again.");
    } finally {
      setResponding(false);
    }
  };

  const callShop = () => {
    const phone = shopInfo?.ownerPhone || shopInfo?.phone;
    if (!phone) return;
    const cleaned = phone.replace(/\D/g, "");
    window.location.href = `tel:${cleaned}`;
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-14 h-14 bg-amber-400/20 rounded-2xl flex items-center justify-center mx-auto mb-3 animate-pulse">
            <span className="text-2xl">🔧</span>
          </div>
          <p className="text-slate-400 text-sm animate-pulse">Loading your service status...</p>
        </div>
      </div>
    );
  }

  const pct = (data.status / (STEPS.length - 1)) * 100;
  const isDone = data.status === 3;

  // All pending part requests with their original indices
  const pendingParts = (data.partRequests || [])
    .map((p, i) => ({ ...p, originalIndex: i }))
    .filter(p => p.status === "pending");

  // All responded part requests (history)
  const respondedParts = (data.partRequests || []).filter(p => p.status !== "pending");

  const shopPhone = shopInfo?.ownerPhone || shopInfo?.phone;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-sm space-y-5">

        {/* Shop Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {shopInfo?.shopImage ? (
              <img src={shopInfo.shopImage} className="w-12 h-12 rounded-2xl object-cover border border-white/10" />
            ) : (
              <div className="w-12 h-12 bg-amber-400/20 rounded-2xl flex items-center justify-center border border-amber-400/30">
                <span className="text-xl">🔧</span>
              </div>
            )}
            <div>
              <p className="text-white font-bold text-base">{shopInfo?.shopName || "Service Center"}</p>
              <p className="text-slate-500 text-xs">Live Service Tracker</p>
            </div>
          </div>

          {/* Call Shop button */}
          {shopPhone && (
            <button
              onClick={callShop}
              className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 rounded-xl px-3 py-2.5 text-green-400 text-xs font-bold active:bg-green-500/30 transition-colors flex-shrink-0"
            >
              <span>📞</span>
              <span>Call Shop</span>
            </button>
          )}
        </div>

        {/* Vehicle Image */}
        {data.image && (
          <div className="rounded-2xl overflow-hidden border border-white/10 relative">
            <img src={data.image} className="w-full h-44 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
            <div className="absolute bottom-3 left-3 text-xs text-white font-medium bg-black/40 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/10">
              📱 {data.phone}
            </div>
          </div>
        )}

        {/* ── PART APPROVAL CARDS ── one per pending request */}
        {pendingParts.length > 0 && (
          <div className="space-y-4">
            {pendingParts.length > 1 && (
              <div className="flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-2xl px-4 py-2.5">
                <span className="text-lg">🔩</span>
                <p className="text-amber-400 text-sm font-semibold">
                  {pendingParts.length} parts need your approval
                </p>
              </div>
            )}
            {pendingParts.map((part) => {
              const idx = part.originalIndex;
              const responded = responseMsgs[idx];
              return (
                <div key={idx} className="bg-amber-400/10 border-2 border-amber-400/40 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🔩</span>
                      <div>
                        <p className="text-amber-400 font-bold text-sm">Part Replacement Needed</p>
                        <p className="text-slate-400 text-xs">Your mechanic needs your approval</p>
                      </div>
                    </div>
                    {pendingParts.length > 1 && (
                      <span className="text-xs bg-amber-400/20 text-amber-300 px-2 py-1 rounded-lg font-semibold">
                        {pendingParts.indexOf(part) + 1}/{pendingParts.length}
                      </span>
                    )}
                  </div>

                  {/* Part details */}
                  <div className="bg-white/5 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-slate-400 text-xs">Part</p>
                      <p className="text-white font-semibold text-sm">{part.partName}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-slate-400 text-xs">Estimated Cost</p>
                      <p className="text-amber-400 font-bold text-lg">₹{part.price}</p>
                    </div>
                  </div>

                  {/* Part photo if available */}
                  {part.photo && (
                    <div className="rounded-xl overflow-hidden">
                      <img src={part.photo} className="w-full h-36 object-cover" />
                    </div>
                  )}

                  {/* Response confirmation for this specific part */}
                  {responded ? (
                    <div className={`rounded-2xl p-3.5 flex items-center gap-3 ${
                      responded.startsWith("✅")
                        ? "bg-green-500/10 border border-green-500/25"
                        : "bg-red-500/10 border border-red-500/25"
                    }`}>
                      <p className="text-sm font-medium text-white">{responded}</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-slate-400 text-xs text-center leading-relaxed">
                        Tap Approve to let the mechanic proceed, or Reject to discuss.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => respondToPartRequest(idx, "rejected")}
                          disabled={responding}
                          className="py-3.5 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-sm active:scale-95 transition-all disabled:opacity-60"
                        >
                          ❌ Reject
                        </button>
                        <button
                          onClick={() => respondToPartRequest(idx, "approved")}
                          disabled={responding}
                          className="py-3.5 rounded-2xl bg-green-500 text-white font-bold text-sm active:scale-95 transition-all shadow-lg shadow-green-500/20 disabled:opacity-60"
                        >
                          ✅ Approve
                        </button>
                      </div>
                    </>
                  )}

                  {/* Call shop option */}
                  {shopPhone && !responded && (
                    <button
                      onClick={callShop}
                      className="w-full py-3 rounded-2xl border border-white/10 text-slate-400 text-sm flex items-center justify-center gap-2 active:bg-white/5 transition-colors"
                    >
                      <span>📞</span>
                      <span>Call shop to discuss instead</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Part request history */}
        {respondedParts.length > 0 && (
          <div className="space-y-2">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Parts History</p>
            {respondedParts.map((part, i) => (
              <div key={i} className={`rounded-xl px-4 py-3 flex items-center justify-between border ${
                part.status === "approved"
                  ? "bg-green-500/8 border-green-500/20"
                  : "bg-red-500/8 border-red-500/20"
              }`}>
                <div>
                  <p className="text-white text-sm font-medium">{part.partName}</p>
                  <p className="text-slate-500 text-xs">₹{part.price}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                  part.status === "approved"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}>
                  {part.status === "approved" ? "✅ Approved" : "❌ Rejected"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Status Card */}
        <div className={`rounded-3xl p-5 border transition-all ${
          isDone
            ? "bg-green-500/10 border-green-500/30"
            : "bg-white/5 border-white/10"
        }`}>

          {/* Current status headline */}
          <div className="text-center mb-5">
            <div className={`text-4xl mb-2 ${isDone ? "animate-bounce" : ""}`}>
              {isDone ? "✅" : data.status === 0 ? "📋" : data.status === 1 ? "⚙️" : "🏁"}
            </div>
            <h2 className={`text-xl font-bold ${isDone ? "text-green-400" : "text-white"}`}>
              {STEPS[data.status]}
            </h2>
            {isDone && (
              <p className="text-green-400/70 text-sm mt-1">Please come collect your vehicle</p>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-5">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Received</span>
              <span>Ready</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  isDone ? "bg-green-500" : "bg-amber-400"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Step dots */}
          <div className="flex justify-between">
            {STEPS.map((step, i) => {
              const active = data.status >= i;
              const current = data.status === i;
              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                    active
                      ? isDone
                        ? "bg-green-500 border-green-400 text-white"
                        : "bg-amber-400 border-amber-300 text-slate-900"
                      : "bg-white/5 border-white/10 text-slate-600"
                  } ${current && !isDone ? "ring-2 ring-amber-400/40 scale-110" : ""}`}>
                    {active ? (i < data.status ? "✓" : i + 1) : i + 1}
                  </div>
                  <span className={`text-[10px] text-center w-14 leading-tight ${
                    active ? "text-slate-300" : "text-slate-600"
                  }`}>
                    {step.replace(" 🎉", "")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info */}
        {!data.image && (
          <div className="flex items-center gap-3 bg-white/4 border border-white/8 rounded-2xl p-4">
            <span className="text-2xl">🚗</span>
            <div>
              <p className="text-white font-medium text-sm">Your Vehicle</p>
              <p className="text-slate-400 text-xs">📱 {data.phone}</p>
            </div>
          </div>
        )}

        {/* Live indicator */}
        <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Updates automatically · No refresh needed
        </div>

        {/* Footer */}
        <p className="text-center text-slate-700 text-xs">Powered by ServiceTracker</p>
      </div>
    </div>
  );
}