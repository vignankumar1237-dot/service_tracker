import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "./AuthContext";

export default function StaffManager({ onClose }) {
  const { shopData } = useAuth();
  const [staff, setStaff] = useState([]);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("staff");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "shops", shopData.shopId, "staff"),
      (snap) => setStaff(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, [shopData.shopId]);

  const addStaff = async () => {
    setError("");
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      setError("Enter a valid phone number");
      return;
    }
    if (!name.trim()) {
      setError("Enter staff name");
      return;
    }

    setAdding(true);
    try {
      // Check if already in another shop
      const indexSnap = await getDoc(doc(db, "staffIndex", cleanPhone));
      if (indexSnap.exists() && indexSnap.data().shopId !== shopData.shopId) {
        setError("This number is already registered in another shop");
        return;
      }

      // Add to staff subcollection
      await setDoc(doc(db, "shops", shopData.shopId, "staff", cleanPhone), {
        phone: cleanPhone,
        name: name.trim(),
        role,
        addedAt: new Date().toISOString(),
      });

      // Add reverse index so login can find which shop
      await setDoc(doc(db, "staffIndex", cleanPhone), {
        shopId: shopData.shopId,
        addedAt: new Date().toISOString(),
      });

      setPhone("");
      setName("");
      setRole("staff");
    } catch (e) {
      setError("Failed to add staff. Try again.");
    } finally {
      setAdding(false);
    }
  };

  const removeStaff = async (member) => {
    if (member.role === "admin" && member.id === shopData.shopId) {
      alert("Cannot remove the owner");
      return;
    }
    if (!confirm(`Remove ${member.name}?`)) return;
    await deleteDoc(doc(db, "shops", shopData.shopId, "staff", member.id));
    await deleteDoc(doc(db, "staffIndex", member.id));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/8 text-slate-300"
        >
          ←
        </button>
        <div>
          <h2 className="font-bold text-white text-base">Manage Staff</h2>
          <p className="text-slate-500 text-xs">{shopData.shopName}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        {/* Add Staff Form */}
        <div className="bg-white/4 border border-white/10 rounded-2xl p-4 space-y-3">
          <p className="text-white font-semibold text-sm">Add Staff Member</p>

          <input
            className="w-full bg-white/6 border border-white/12 rounded-xl px-4 py-3 text-white text-sm outline-none placeholder-slate-600 focus:border-amber-400/50"
            placeholder="Staff name (e.g. Raju)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="flex items-center bg-white/6 border border-white/12 rounded-xl overflow-hidden focus-within:border-amber-400/50">
            <span className="text-slate-400 pl-4 pr-2 text-sm">+91</span>
            <input
              className="flex-1 bg-transparent text-white py-3 pr-4 outline-none placeholder-slate-600 text-sm"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              maxLength={15}
            />
          </div>

          {/* Role selector */}
          <div className="flex gap-2">
            {["staff", "admin"].map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  role === r
                    ? "bg-amber-400 text-slate-900"
                    : "bg-white/6 text-slate-400 border border-white/10"
                }`}
              >
                {r === "admin" ? "👑 Admin" : "🔧 Staff"}
              </button>
            ))}
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            onClick={addStaff}
            disabled={adding}
            className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-900 font-bold py-3 rounded-xl text-sm transition-all active:scale-95"
          >
            {adding ? "Adding..." : "+ Add Staff"}
          </button>
        </div>

        {/* Staff List */}
        <div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">
            Current Staff ({staff.length})
          </p>
          <div className="space-y-2">
            {staff.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between bg-white/4 border border-white/8 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/20 flex items-center justify-center text-sm font-bold text-amber-400">
                    {member.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{member.name}</p>
                    <p className="text-slate-500 text-xs">+91 {member.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-lg font-medium ${
                      member.role === "admin"
                        ? "bg-amber-400/20 text-amber-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {member.role === "admin" ? "👑 Admin" : "🔧 Staff"}
                  </span>
                  {!(member.role === "admin" && member.id === shopData.shopId) && (
                    <button
                      onClick={() => removeStaff(member)}
                      className="text-red-400/60 hover:text-red-400 text-xs p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info box */}
        <div className="bg-blue-500/8 border border-blue-500/20 rounded-2xl p-4">
          <p className="text-blue-400 text-xs font-semibold mb-1">ℹ️ How staff login works</p>
          <p className="text-slate-400 text-xs leading-relaxed">
            Staff members log in using their own phone number on the same login screen. They'll automatically see your shop's jobs. Admins can do everything; Staff can add and update jobs but cannot delete.
          </p>
        </div>
      </div>
    </div>
  );
}