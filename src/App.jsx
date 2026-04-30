import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import Add from "./components/Add";
import Item from "./components/Item";
import ProfileSheet from "./ProfileSheet";
import StaffManager from "./StaffManager";
import AdminDashboard from "./AdminDashboard";
//modules added//
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
  const [showStaff, setShowStaff] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [filter, setFilter] = useState("active");

  const shop = shopData?.shopId;
  const isAdmin = shopData?.role === "admin";

  // Real-time listener
  useEffect(() => {
    if (!shop) return;
    const q = query(
      collection(db, "shops", shop, "jobs"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setServices(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [shop]);

  // Add job
  const addService = async (phone, image, serviceType, notes) => {
    await addDoc(collection(db, "shops", shop, "jobs"), {
      phone,
      image: image || null,
      serviceType: serviceType || "General Service",
      notes: notes || "",
      status: 0,
      createdAt: new Date(),
      shopName: shopData?.shopName,
      addedBy: shopData?.staffName || "Staff",
    });
    setView("home");
  };
//newcode
  // Update status
  const update = async (id, step, phone) => {
    // Open WhatsApp FIRST synchronously before any await
    // Using invisible <a> click — works on iOS Safari + Android Chrome
    // window.open after await gets blocked on all mobiles
    if (step === 1) {
      const trackLink = `${window.location.origin}/track/${shop}/${id}`;
      const msg = encodeURIComponent(
        `👋 Welcome to *${shopData?.shopName}*!\n\nYour service request has been received and work has started 🔧\n\nTrack your service live here 👇\n${trackLink}\n\n_Thank you for choosing us!_`
      );
      const cleaned = phone.replace(/\D/g, "");
      const waPhone =
        cleaned.startsWith("91") && cleaned.length === 12
          ? cleaned
          : `91${cleaned.replace(/^0/, "")}`;

      const a = document.createElement("a");
      a.href = `https://wa.me/${waPhone}?text=${msg}`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    // Save to Firestore after
    await updateDoc(doc(db, "shops", shop, "jobs", id), {
      status: step,
      [`statusHistory.step${step}`]: {
        by: shopData?.staffName || "Staff",
        at: new Date().toISOString(),
      },
    });
  };

  // Delete — admin only
  const remove = async (id) => {
    if (!isAdmin) return;
    if (confirm("Delete this record?")) {
      await deleteDoc(doc(db, "shops", shop, "jobs", id));
    }
  };

  const activeJobs = services.filter((s) => s.status < 3);
  const doneJobs = services.filter((s) => s.status === 3);
  const displayedJobs = filter === "active" ? activeJobs : doneJobs;

  if (view === "add") {
    return (
      <Add
        onSave={addService}
        onBack={() => setView("home")}
        shopName={shopData?.shopName}
      />
    );
  }

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
        className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-white/8"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: logo + name */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {shopData?.shopImage ? (
              <img
                src={shopData.shopImage}
                className="w-8 h-8 rounded-xl object-cover border border-white/10 flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 bg-amber-400/20 rounded-xl flex items-center justify-center border border-amber-400/30 flex-shrink-0">
                <span className="text-sm">🔧</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate">
                {shopData?.shopName}
              </p>
              <p className="text-slate-500 text-xs leading-tight">
                {activeJobs.length} active · {doneJobs.length} done
              </p>
            </div>
          </div>

          {/* Right: icons */}
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            {/* Role badge — only show on wider screens to save space */}
            <span
              className={`hidden sm:inline-flex text-xs px-2 py-1 rounded-lg font-medium ${
                isAdmin
                  ? "bg-amber-400/20 text-amber-400"
                  : "bg-blue-500/20 text-blue-400"
              }`}
            >
              {isAdmin ? "👑 Admin" : shopData?.staffName || "Staff"}
            </span>

            {isAdmin && (
              <button
                onClick={() => setShowDashboard(true)}
                className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center text-slate-300 active:bg-white/16 border border-white/8"
              >
                <span className="text-sm">📊</span>
              </button>
            )}

            <button
              onClick={() => setShowProfile(true)}
              className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center text-slate-300 active:bg-white/16 border border-white/8"
            >
              <span className="text-sm">👤</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">

        {/* Add Button */}
        <div className="px-4 pt-4">
          <button
            onClick={() => setView("add")}
            className="w-full bg-amber-400 active:bg-amber-300 text-slate-900 font-bold py-4 rounded-2xl text-base transition-all active:scale-95 shadow-lg shadow-amber-400/15 flex items-center justify-center gap-2"
          >
            <span className="text-xl leading-none">+</span>
            <span>Add New Job</span>
          </button>
        </div>

        {/* Admin quick actions */}
        {isAdmin && (
          <div className="flex gap-2 px-4 pt-3">
            <button
              onClick={() => setShowStaff(true)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white/4 border border-white/8 rounded-xl py-3 text-slate-300 text-xs font-semibold active:bg-white/10 transition-colors"
            >
              <span>👥</span>
              <span>Manage Staff</span>
            </button>
            <button
              onClick={() => setShowDashboard(true)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white/4 border border-white/8 rounded-xl py-3 text-slate-300 text-xs font-semibold active:bg-white/10 transition-colors"
            >
              <span>📊</span>
              <span>Dashboard</span>
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 px-4 pt-3">
          {[
            { key: "active", label: `Active (${activeJobs.length})` },
            { key: "done", label: `Done (${doneJobs.length})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                filter === key
                  ? "bg-amber-400 text-slate-900"
                  : "bg-white/6 text-slate-400 border border-white/8 active:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Job List */}
        <div className="px-4 pt-3 pb-8 space-y-3">
          {displayedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">
                {filter === "active" ? "🔧" : "✅"}
              </div>
              <p className="text-slate-400 font-medium text-base">
                {filter === "active" ? "No active jobs" : "No completed jobs"}
              </p>
              <p className="text-slate-600 text-sm mt-1">
                {filter === "active"
                  ? "Tap + Add New Job to get started"
                  : "Completed jobs appear here"}
              </p>
            </div>
          ) : (
            displayedJobs.map((s) => (
              <Item
                key={s.id}
                data={s}
                update={update}
                remove={isAdmin ? remove : null}
                shopName={shopData?.shopName}
                isAdmin={isAdmin}
              />
            ))
          )}
        </div>
      </div>

      {/* Overlays */}
      {showProfile && <ProfileSheet onClose={() => setShowProfile(false)} />}
      {showStaff && <StaffManager onClose={() => setShowStaff(false)} />}
      {showDashboard && <AdminDashboard onClose={() => setShowDashboard(false)} />}
    </div>
  );
}