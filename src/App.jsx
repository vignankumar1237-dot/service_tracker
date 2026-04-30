import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import Add from "./components/Add";
import Item from "./components/Item";
import ProfileSheet from "./ProfileSheet";

import { db } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy,
  deleteDoc,
} from "firebase/firestore";

export default function App() {
  const { shopData } = useAuth();
  const [view, setView] = useState("home");
  const [services, setServices] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [filter, setFilter] = useState("active"); // "active" | "done"

  const shop = shopData?.shopId;

  // 🔥 REAL-TIME LISTENER
  useEffect(() => {
    if (!shop) return;

    const q = query(
      collection(db, "shops", shop, "jobs"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setServices(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });

    return () => unsub();
  }, [shop]);

  // ➕ ADD VEHICLE
  const addService = async (phone, image) => {
    await addDoc(collection(db, "shops", shop, "jobs"), {
      phone,
      image: image || null,
      status: 0,
      createdAt: new Date(),
      shopName: shopData?.shopName,
    });
    setView("home");
  };

  // 🔄 UPDATE STATUS
//   const update = async (id, step, phone) => {
//     await updateDoc(doc(db, "shops", shop, "jobs", id), { status: step });

//     const trackLink = `${window.location.origin}/track/${shop}/${id}`;

//     // On START → open WhatsApp with pre-filled message
//     if (step === 1) {
//      const msg = encodeURIComponent(
//   `👋 Welcome to *${shopData?.shopName}*!\n\nYour vehicle has been received and work has started 🔧\n\nTrack your service live here 👇\n${trackLink}\n\n_Thank you for choosing us!_`
// );
//      const cleaned = phone.replace(/\D/g, "");
// const waPhone = cleaned.startsWith("91") && cleaned.length === 12
//   ? cleaned
//   : `91${cleaned.replace(/^0/, "")}`;
//       window.open(`https://wa.me/${waPhone}?text=${msg}`, "_blank");
//     }

//     if (step === 3) {
//       // Notify ready — open WhatsApp
//      const msg = encodeURIComponent(
//   `✅ *${shopData?.shopName}* — Your vehicle is *ready for pickup!* 🎉\n\nPlease come collect at your convenience.\n\nTrack here 👇\n${trackLink}`
// );
//       const cleaned = phone.replace(/\D/g, "");
//       const waPhone = cleaned.startsWith("91") ? cleaned : `91${cleaned}`;
//       window.open(`https://wa.me/${waPhone}?text=${msg}`, "_blank");
//     }
//   };

const update = async (id, step, phone) => {
  const trackLink = `${window.location.origin}/track/${shop}/${id}`;

  if (step === 1) {
    const msg = encodeURIComponent(
      `👋 Welcome to *${shopData?.shopName}*!\n\nYour vehicle has been received and work has started 🔧\n\nTrack your service live here 👇\n${trackLink}\n\n_Thank you for choosing us!_`
    );
    const cleaned = phone.replace(/\D/g, "");
    const waPhone = cleaned.startsWith("91") && cleaned.length === 12
      ? cleaned
      : `91${cleaned.replace(/^0/, "")}`;
    window.open(`https://wa.me/${waPhone}?text=${msg}`, "_blank");
  }

  // if (step === 3) {
  //   const msg = encodeURIComponent(
  //     `✅ *${shopData?.shopName}* — Your vehicle is *ready for pickup!* 🎉\n\nPlease come collect at your convenience.\n\nTrack here 👇\n${trackLink}`
  //   );
  //   const cleaned = phone.replace(/\D/g, "");
  //   const waPhone = cleaned.startsWith("91") && cleaned.length === 12
  //     ? cleaned
  //     : `91${cleaned.replace(/^0/, "")}`;
  //   window.open(`https://wa.me/${waPhone}?text=${msg}`, "_blank");
  // }

  await updateDoc(doc(db, "shops", shop, "jobs", id), { status: step });
};
  // 🗑 DELETE
  const remove = async (id) => {
    if (confirm("Delete this record?")) {
      await deleteDoc(doc(db, "shops", shop, "jobs", id));
    }
  };

  const activeJobs = services.filter((s) => s.status < 3);
  const doneJobs = services.filter((s) => s.status === 3);
  const displayedJobs = filter === "active" ? activeJobs : doneJobs;

  // ADD SCREEN
  if (view === "add") {
    return (
      <Add
        onSave={addService}
        onBack={() => setView("home")}
        shopName={shopData?.shopName}
      />
    );
  }

  // HOME
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col max-w-lg mx-auto">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-white/8">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            {shopData?.shopImage ? (
              <img
                src={shopData.shopImage}
                className="w-9 h-9 rounded-xl object-cover border border-white/10"
              />
            ) : (
              <div className="w-9 h-9 bg-amber-400/20 rounded-xl flex items-center justify-center border border-amber-400/30">
                <span className="text-lg">🔧</span>
              </div>
            )}
            <div>
              <p className="text-white font-bold text-sm leading-tight">{shopData?.shopName}</p>
              <p className="text-slate-500 text-xs">
                {activeJobs.length} active · {doneJobs.length} done
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowProfile(true)}
            className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center text-slate-300 hover:bg-white/12 transition-colors border border-white/8"
          >
            <span className="text-base">👤</span>
          </button>
        </div>
      </div>

      {/* Add Button */}
      <div className="px-5 pt-5">
        <button
          onClick={() => setView("add")}
          className="w-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold py-4 rounded-2xl text-base transition-all active:scale-95 shadow-lg shadow-amber-400/15 flex items-center justify-center gap-2"
        >
          <span className="text-xl">+</span>
          <span>Add Vehicle</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 px-5 pt-4">
        {[
          { key: "active", label: `Active (${activeJobs.length})` },
          { key: "done", label: `Done (${doneJobs.length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === key
                ? "bg-amber-400 text-slate-900"
                : "bg-white/6 text-slate-400 hover:text-white border border-white/8"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Job List */}
      <div className="flex-1 px-5 py-4 space-y-4 pb-8">
        {displayedJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">{filter === "active" ? "🚗" : "✅"}</div>
            <p className="text-slate-400 font-medium">
              {filter === "active" ? "No active vehicles" : "No completed jobs"}
            </p>
            <p className="text-slate-600 text-sm mt-1">
              {filter === "active" ? "Tap + Add Vehicle to get started" : "Completed jobs appear here"}
            </p>
          </div>
        ) : (
          displayedJobs.map((s) => (
            <Item
              key={s.id}
              data={s}
              update={update}
              remove={remove}
              shopName={shopData?.shopName}
            />
          ))
        )}
      </div>

      {/* Profile Sheet */}
      {showProfile && <ProfileSheet onClose={() => setShowProfile(false)} />}
    </div>
  );
}
