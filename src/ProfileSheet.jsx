import { useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { compressShopLogo } from "./imageUtils";

export default function ProfileSheet({ onClose }) {
  const { shopData, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [shopName, setShopName] = useState(shopData?.shopName || "");
  const [shopImage, setShopImage] = useState(shopData?.shopImage || null);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const handleImagePick = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setShopImage(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!shopName.trim()) return;
    setSaving(true);
    try {
      let imageToSave = shopImage;
      if (imageFile) {
        imageToSave = await compressShopLogo(imageFile);
      }
      await updateProfile({ shopName: shopName.trim(), shopImage: imageToSave });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Logout from this device?")) {
      logout();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 rounded-t-3xl border-t border-white/10 shadow-2xl max-w-lg mx-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        <div className="p-5 space-y-5 pb-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-lg">Shop Profile</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white text-xl transition-colors">✕</button>
          </div>

          {/* Shop Card */}
          <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-white/8">
            {shopData?.shopImage ? (
              <img src={shopData.shopImage} className="w-16 h-16 rounded-xl object-cover border border-white/10" />
            ) : (
              <div className="w-16 h-16 bg-amber-400/20 rounded-xl flex items-center justify-center border border-amber-400/30">
                <span className="text-2xl">🔧</span>
              </div>
            )}
            <div>
              <p className="text-white font-bold text-base">{shopData?.shopName}</p>
              <p className="text-slate-400 text-sm">📱 {shopData?.phone}</p>
              <p className="text-slate-600 text-xs mt-1">ID: {shopData?.shopId}</p>
            </div>
          </div>

          {/* Edit Section */}
          {editing ? (
            <div className="space-y-3">
              <input
                className="w-full bg-white/8 border border-white/10 rounded-xl text-white py-3 px-4 text-sm outline-none focus:border-amber-400/50 transition-colors"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Shop name"
              />

              <input ref={fileRef} type="file" accept="image/*" onChange={handleImagePick} className="hidden" />

              {shopImage ? (
                <div className="relative">
                  <img src={shopImage} className="w-full h-28 object-cover rounded-xl" />
                  <button
                    onClick={() => { setShopImage(null); setImageFile(null); }}
                    className="absolute top-2 right-2 bg-slate-900/80 text-white text-xs rounded-lg px-2 py-1"
                  >✕</button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current.click()}
                  className="w-full border border-dashed border-white/20 rounded-xl py-4 text-slate-500 text-sm hover:border-amber-400/40 transition-colors"
                >
                  📷 Add shop photo
                </button>
              )}

              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="px-4 py-2.5 border border-white/10 rounded-xl text-slate-400 text-sm">Cancel</button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-amber-400 text-slate-900 font-bold py-2.5 rounded-xl text-sm disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="w-full py-3 rounded-xl border border-white/10 text-slate-300 text-sm hover:bg-white/5 transition-colors"
            >
              ✏️ Edit Shop Details
            </button>
          )}

          {/* Divider */}
          <div className="border-t border-white/8" />

          {/* Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-3 border border-white/8">
              <p className="text-slate-500 text-xs">Registered</p>
              <p className="text-slate-300 text-sm font-medium mt-0.5">Active</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/8">
              <p className="text-slate-500 text-xs">Login Method</p>
              <p className="text-slate-300 text-sm font-medium mt-0.5">Mobile OTP-free</p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-sm hover:bg-red-500/20 transition-colors active:scale-95"
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </>
  );
}
