import { useRef, useState } from "react";
import { compressVehiclePhoto } from "../imageUtils";

export default function Add({ onSave, onBack, shopName }) {
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState(null);
  const [imageData, setImageData] = useState(null); // compressed base64
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCompressing(true);
    try {
      const compressed = await compressVehiclePhoto(file);
      setImageData(compressed);
      setImage(URL.createObjectURL(file)); // preview
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
      await onSave(phone.trim(), imageData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* Header */}
      <div className="flex items-center gap-3 p-5 border-b border-white/8">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/8 text-slate-300 hover:bg-white/12 transition-colors"
        >
          ←
        </button>
        <div>
          <h2 className="font-bold text-white text-base">Add Vehicle</h2>
          <p className="text-slate-500 text-xs">{shopName}</p>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-5">

        {/* Phone Input */}
        <div>
          <label className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2 block">Customer Mobile</label>
          <div className="flex items-center bg-white/6 border border-white/12 rounded-2xl overflow-hidden focus-within:border-amber-400/50 transition-colors">
            <span className="text-slate-400 pl-4 pr-2 text-sm">+91</span>
            <input
              className="flex-1 bg-transparent text-white py-4 pr-4 outline-none placeholder-slate-600 text-base"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              maxLength={15}
            />
          </div>
        </div>

        {/* Vehicle Photo */}
        <div>
          <label className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2 block">Vehicle Photo (optional)</label>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImage}
            className="hidden"
          />

          {image ? (
            <div className="relative rounded-2xl overflow-hidden">
              <img src={image} className="w-full h-52 object-cover" />
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
              className="w-full border-2 border-dashed border-white/15 rounded-2xl py-10 flex flex-col items-center gap-3 text-slate-500 hover:border-amber-400/40 hover:text-slate-400 transition-colors active:scale-98"
            >
              <span className="text-4xl">📷</span>
              <div className="text-center">
                <p className="text-sm font-medium">Take Vehicle Photo</p>
                <p className="text-xs text-slate-600 mt-1">Helps identify the vehicle</p>
              </div>
            </button>
          )}
        </div>

        {/* Tips */}
        <div className="bg-amber-400/8 border border-amber-400/20 rounded-2xl p-4">
          <p className="text-amber-400 text-xs font-semibold mb-1">💡 Tip</p>
          <p className="text-slate-400 text-xs leading-relaxed">
            Customer will receive a WhatsApp tracking link when you start work. Photo helps them identify their vehicle in your updates.
          </p>
        </div>
      </div>

      {/* Bottom Save Button */}
      <div className="p-5 border-t border-white/8">
        <button
          onClick={handleSave}
          disabled={saving || compressing}
          className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-900 font-bold py-4 rounded-2xl text-base transition-all active:scale-95 shadow-lg shadow-amber-400/20"
        >
          {saving ? "Saving..." : "Add Vehicle →"}
        </button>
      </div>
    </div>
  );
}
