import { useState } from "react";
import { db } from "../firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { compressVehiclePhoto } from "../imageUtils";

const STATUS_LABELS = ["Received", "Started", "In Progress", "Done ✓"];
const STATUS_COLORS = [
  "bg-slate-700 text-slate-300",
  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "bg-green-500/20 text-green-300 border-green-500/30",
];

export default function Item({ data, update, remove, isAdmin, shopData }) {
  const [showPartForm, setShowPartForm] = useState(false);
  const [partName, setPartName] = useState("");
  const [partPrice, setPartPrice] = useState("");
  const [partPhoto, setPartPhoto] = useState(null);
  const [partPhotoData, setPartPhotoData] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [sending, setSending] = useState(false);

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

  const handlePartPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setCompressing(true);
    try {
      const compressed = await compressVehiclePhoto(file);
      setPartPhotoData(compressed);
      setPartPhoto(URL.createObjectURL(file));
    } catch {
      alert("Image processing failed");
    } finally {
      setCompressing(false);
    }
  };

  const sendPartRequest = async () => {
    if (!partName.trim()) { alert("Enter part name"); return; }
    if (!partPrice.trim()) { alert("Enter price"); return; }
    setSending(true);
    try {
      const request = {
        partName: partName.trim(),
        price: partPrice.trim(),
        photo: partPhotoData || null,
        status: "pending", // pending | approved | rejected
        requestedAt: new Date().toISOString(),
        respondedAt: null,
      };

      await updateDoc(doc(db, "shops", shopData.shopId, "jobs", data.id), {
        partRequests: arrayUnion(request),
      });

      // Send WhatsApp to customer
      const trackLink = `${window.location.origin}/track/${shopData.shopId}/${data.id}`;
      const msg = encodeURIComponent(
        `🔧 *${shopData.shopName}* - Part Approval Needed\n\n` +
        `Part: *${partName.trim()}*\n` +
        `Estimated Cost: *₹${partPrice.trim()}*\n\n` +
        `Please approve or reject on your tracking page 👇\n${trackLink}\n\n` +
        `_Or call us directly to discuss._`
      );
      const cleaned = data.phone.replace(/\D/g, "");
      const waPhone = cleaned.startsWith("91") && cleaned.length === 12
        ? cleaned : `91${cleaned.replace(/^0/, "")}`;
      const a = document.createElement("a");
      a.href = `https://wa.me/${waPhone}?text=${msg}`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Reset form
      setPartName("");
      setPartPrice("");
      setPartPhoto(null);
      setPartPhotoData(null);
      setShowPartForm(false);
    } catch (e) {
      alert("Failed to send request. Try again.");
    } finally {
      setSending(false);
    }
  };

  const callCustomer = () => {
    const cleaned = data.phone.replace(/\D/g, "");
    window.location.href = `tel:${cleaned}`;
  };

  // All pending part requests
  const pendingParts = (data.partRequests || []).filter(p => p.status === "pending");
  const latestResponse = data.partRequests?.slice().reverse().find(p => p.status !== "pending");

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

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Call Customer button */}
            <button
              onClick={callCustomer}
              className="w-8 h-8 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 active:bg-green-500/30 transition-colors"
              title="Call Customer"
            >
              📞
            </button>

            {!data.image && (
              <div className={`text-xs font-bold px-2.5 py-1.5 rounded-full border ${STATUS_COLORS[data.status]}`}>
                {STATUS_LABELS[data.status]}
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {data.notes ? (
          <p className="text-slate-400 text-xs bg-white/4 rounded-lg px-3 py-2 leading-relaxed">
            📝 {data.notes}
          </p>
        ) : null}

        {/* Pending part request banners — one per pending request */}
        {pendingParts.length > 0 && (
          <div className="space-y-1.5">
            {pendingParts.map((part, i) => (
              <div key={i} className="bg-amber-400/10 border border-amber-400/30 rounded-xl px-3 py-2.5 flex items-center gap-2">
                <span className="text-lg">⏳</span>
                <div className="min-w-0 flex-1">
                  <p className="text-amber-400 text-xs font-semibold">
                    Awaiting approval {pendingParts.length > 1 ? `(${i + 1}/${pendingParts.length})` : ""}
                  </p>
                  <p className="text-slate-400 text-xs truncate">
                    {part.partName} · ₹{part.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Latest response banner */}
        {pendingParts.length === 0 && latestResponse && (
          <div className={`rounded-xl px-3 py-2.5 flex items-center gap-2 ${
            latestResponse.status === "approved"
              ? "bg-green-500/10 border border-green-500/25"
              : "bg-red-500/10 border border-red-500/25"
          }`}>
            <span className="text-lg">{latestResponse.status === "approved" ? "✅" : "❌"}</span>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-semibold ${latestResponse.status === "approved" ? "text-green-400" : "text-red-400"}`}>
                Customer {latestResponse.status === "approved" ? "approved" : "rejected"} the part
              </p>
              <p className="text-slate-400 text-xs truncate">
                {latestResponse.partName} · ₹{latestResponse.price}
              </p>
            </div>
          </div>
        )}

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

        {/* Request Part button — only when job is active (status 1 or 2) */}
        {data.status >= 1 && data.status < 3 && (
          <button
            onClick={() => setShowPartForm(!showPartForm)}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 border ${
              showPartForm
                ? "bg-orange-500/20 border-orange-500/40 text-orange-300"
                : "bg-white/5 border-white/12 text-slate-400 hover:text-slate-300 hover:bg-white/8"
            }`}
          >
            <span>🔩</span>
            <span>{showPartForm ? "Cancel Request" : "Request Part Approval"}</span>
          </button>
        )}

        {/* Part Request Form */}
        {showPartForm && (
          <div className="bg-slate-900 border border-white/10 rounded-xl p-3.5 space-y-3">
            <p className="text-white text-xs font-semibold">Send Part Request to Customer</p>

            <input
              className="w-full bg-white/6 border border-white/12 rounded-xl px-3 py-2.5 text-white text-sm outline-none placeholder-slate-600 focus:border-amber-400/50"
              placeholder="Part name (e.g. Brake pads, Compressor)"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
            />

            <div className="flex items-center bg-white/6 border border-white/12 rounded-xl overflow-hidden focus-within:border-amber-400/50">
              <span className="text-slate-400 pl-3 pr-1 text-sm">₹</span>
              <input
                className="flex-1 bg-transparent text-white py-2.5 pr-3 outline-none placeholder-slate-600 text-sm"
                placeholder="Price (e.g. 3000)"
                value={partPrice}
                onChange={(e) => setPartPrice(e.target.value)}
                type="number"
                inputMode="numeric"
              />
            </div>

            {/* Part photo */}
            <div>
              <input
                type="file"
                accept="image/*"
                id={`part-photo-${data.id}`}
                onChange={handlePartPhoto}
                className="hidden"
              />
              {partPhoto ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={partPhoto} className="w-full h-28 object-cover" />
                  {compressing && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <p className="text-white text-xs animate-pulse">Compressing...</p>
                    </div>
                  )}
                  <button
                    onClick={() => { setPartPhoto(null); setPartPhotoData(null); }}
                    className="absolute top-2 right-2 bg-slate-900/80 text-white text-xs rounded-lg px-2 py-1"
                  >✕</button>
                </div>
              ) : (
                <label
                  htmlFor={`part-photo-${data.id}`}
                  className="flex items-center gap-2 border border-dashed border-white/15 rounded-xl py-3 px-3 text-slate-500 text-xs cursor-pointer hover:border-amber-400/30 transition-colors"
                >
                  <span>📷</span>
                  <span>Add photo of part / damage (optional)</span>
                </label>
              )}
            </div>

            <button
              onClick={sendPartRequest}
              disabled={sending || compressing}
              className="w-full bg-amber-400 disabled:opacity-60 text-slate-900 font-bold py-2.5 rounded-xl text-sm active:scale-95 transition-all"
            >
              {sending ? "Sending..." : "Send via WhatsApp 📲"}
            </button>
          </div>
        )}

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