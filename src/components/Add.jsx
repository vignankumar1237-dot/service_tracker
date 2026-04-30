import { useRef, useState } from "react";
import { compressVehiclePhoto } from "../imageUtils";

const SERVICE_TYPES = [
  "General Service",
  "Repair",
  "Bike / Scooter",
  "Car",
  "AC / Refrigerator",
  "Washing Machine",
  "TV / Electronics",
  "Plumbing",
  "Other",
];

export default function Add({ onSave, onBack, shopName }) {
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serviceType, setServiceType] = useState("General Service");
  const [notes, setNotes] = useState("");
  const fileRef = useRef();

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setCompressing(true);
    try {
      const compressed = await compressVehiclePhoto(file);
      setImageData(compressed);
      setImage(URL.createObjectURL(file));
    } catch {
      alert("Image processing failed");
    } finally {
      setCompressing(false);
    }
  };

  const handleSave = async () => {
    if (!phone.trim()) {
      alert("Enter customer phone number");
      return;
    }
    setSaving(true);
    try {
      await onSave(phone.trim(), imageData, serviceType, notes.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="bg-slate-950 text-white flex flex-col max-w-lg mx-auto"
      style={{
        minHeight: "100dvh",
        paddingBottom: "env(safe-area-inset-bottom, 16px)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-white/8 flex-shrink-0"
        style={{ paddingTop: "env(safe-area-inset-top, 12px)" }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/8 text-slate-300 active:bg-white/16 flex-shrink-0 text-lg"
        >
          ←
        </button>
        <div>
          <h2 className="font-bold text-white text-base leading-tight">Add New Job</h2>
          <p className="text-slate-500 text-xs">{shopName}</p>
        </div>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {/* Service Type */}
        <div>
          <label className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2.5 block">
            Service Type
          </label>
          <div className="flex flex-wrap gap-2">
            {SERVICE_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setServiceType(type)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                  serviceType === type
                    ? "bg-amber-400 text-slate-900"
                    : "bg-white/6 text-slate-400 border border-white/10"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Phone Input */}
        <div>
          <label className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2 block">
            Customer Mobile
          </label>
          <div className="flex items-center bg-white/6 border border-white/12 rounded-2xl overflow-hidden focus-within:border-amber-400/50 transition-colors">
            <span className="text-slate-400 pl-4 pr-2 text-sm flex-shrink-0">+91</span>
            <input
              className="flex-1 bg-transparent text-white py-4 pr-4 outline-none placeholder-slate-600 text-base min-w-0"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              inputMode="numeric"
              maxLength={15}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2 block">
            Issue / Notes (optional)
          </label>
          <textarea
            className="w-full bg-white/6 border border-white/12 rounded-2xl px-4 py-3 text-white text-sm outline-none placeholder-slate-600 focus:border-amber-400/50 resize-none leading-relaxed"
            placeholder="e.g. Not cooling, strange noise, screen broken..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Photo */}
        <div>
          <label className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2 block">
            Photo (optional)
          </label>

          {/* No capture attribute — phone will show Camera + Gallery option natively on all devices */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleImage}
            className="hidden"
          />

          {image ? (
            <div className="relative rounded-2xl overflow-hidden">
              <img src={image} className="w-full h-44 object-cover" />
              {compressing && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-white text-sm animate-pulse">⚙️ Compressing...</div>
                </div>
              )}
              <button
                onClick={() => { setImage(null); setImageData(null); }}
                className="absolute top-3 right-3 bg-slate-900/80 text-white text-xs rounded-xl px-3 py-1.5 backdrop-blur-sm border border-white/10"
              >
                ✕ Remove
              </button>
              <div className="absolute bottom-3 left-3 bg-green-500/80 text-white text-xs rounded-lg px-2 py-1 backdrop-blur-sm">
                ✓ Photo added
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current.click()}
              className="w-full border-2 border-dashed border-white/15 rounded-2xl py-8 flex flex-col items-center gap-2 text-slate-500 active:border-amber-400/40 active:text-slate-400 transition-colors"
            >
              <span className="text-3xl">📷</span>
              <div className="text-center">
                <p className="text-sm font-medium">Take / Upload Photo</p>
                <p className="text-xs text-slate-600 mt-0.5">Camera or Gallery</p>
              </div>
            </button>
          )}
        </div>

        {/* Tip */}
        <div className="bg-amber-400/8 border border-amber-400/20 rounded-2xl p-4">
          <p className="text-amber-400 text-xs font-semibold mb-1">💡 Tip</p>
          <p className="text-slate-400 text-xs leading-relaxed">
            Customer will receive a WhatsApp tracking link when you tap Start. Works for any service — bike, AC, fridge, electronics, and more.
          </p>
        </div>
      </div>

      {/* Fixed Save Button */}
      <div className="px-4 py-3 border-t border-white/8 flex-shrink-0">
        <button
          onClick={handleSave}
          disabled={saving || compressing}
          className="w-full bg-amber-400 active:bg-amber-300 disabled:opacity-60 text-slate-900 font-bold py-4 rounded-2xl text-base transition-all active:scale-95 shadow-lg shadow-amber-400/20"
        >
          {saving ? "Saving..." : "Add Job →"}
        </button>
      </div>
    </div>
  );
}