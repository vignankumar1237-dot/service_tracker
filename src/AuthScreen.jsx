import { useState, useRef } from "react";
import { useAuth } from "./AuthContext";
import { compressShopLogo } from "./imageUtils";

export default function AuthScreen() {
  const { register, login } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [step, setStep] = useState(1); // register steps: 1=phone, 2=shop details
  const [phone, setPhone] = useState("");
  const [ownerPhone, setOwnerPhone] = useState(""); // direct call number shown to customers
  const [shopName, setShopName] = useState("");
  const [shopImage, setShopImage] = useState(null);
  const [shopImageFile, setShopImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const handleImagePick = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setShopImageFile(file);
    const preview = URL.createObjectURL(file);
    setShopImage(preview);
  };

  const handleLogin = async () => {
    if (!phone.trim()) { setError("Enter your mobile number"); return; }
    setLoading(true);
    setError("");
    try {
      await login(phone.trim());
    } catch (err) {
      if (err.message === "NOT_FOUND") {
        setError("No shop found. Please register first.");
      } else {
        setError("Something went wrong. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterStep1 = () => {
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleRegister = async () => {
    if (!shopName.trim()) { setError("Enter your shop name"); return; }
    setLoading(true);
    setError("");
    try {
      let compressedImage = null;
      if (shopImageFile) {
        compressedImage = await compressShopLogo(shopImageFile);
      }
      // ownerPhone defaults to the login phone if not separately set
      const contactPhone = ownerPhone.trim() || phone.trim();
      await register({
        phone: phone.trim(),
        shopName: shopName.trim(),
        shopImage: compressedImage,
        ownerPhone: contactPhone,
      });
    } catch (err) {
      if (err.message === "ALREADY_REGISTERED") {
        setError("This number is already registered. Please login.");
        setMode("login");
        setStep(1);
      } else {
        setError("Registration failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
      {/* Logo / Brand */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-400/30">
          <span className="text-3xl">🔧</span>
        </div>
        <h1 className="text-white text-2xl font-bold tracking-tight">ServiceTracker</h1>
        <p className="text-slate-400 text-sm mt-1">Workshop Management</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl">

        {/* Tabs */}
        <div className="flex bg-white/5 rounded-2xl p-1 mb-6 gap-1">
          {["login", "register"].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setStep(1); setError(""); }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                mode === m
                  ? "bg-amber-400 text-slate-900 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {m === "login" ? "Login" : "Register"}
            </button>
          ))}
        </div>

        {/* LOGIN */}
        {mode === "login" && (
          <div className="space-y-4">
            <div>
              <label className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2 block">Mobile Number</label>
              <div className="flex items-center bg-white/8 border border-white/10 rounded-xl overflow-hidden focus-within:border-amber-400/50 transition-colors">
                <span className="text-slate-400 pl-4 pr-2 text-sm">+91</span>
                <input
                  className="flex-1 bg-transparent text-white py-3 pr-4 outline-none placeholder-slate-600 text-sm"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  maxLength={15}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-900 font-bold py-3 rounded-xl transition-all text-sm shadow-lg shadow-amber-400/20 active:scale-95"
            >
              {loading ? "Checking..." : "Login →"}
            </button>

            <p className="text-center text-slate-500 text-xs">
              New workshop?{" "}
              <button onClick={() => { setMode("register"); setError(""); }} className="text-amber-400 underline">
                Register here
              </button>
            </p>
          </div>
        )}

        {/* REGISTER */}
        {mode === "register" && (
          <div className="space-y-4">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-2">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step >= s ? "bg-amber-400 text-slate-900" : "bg-white/10 text-slate-500"
                  }`}>{s}</div>
                  {s < 2 && <div className={`flex-1 h-px w-16 ${step > s ? "bg-amber-400" : "bg-white/10"}`} />}
                </div>
              ))}
              <span className="text-slate-500 text-xs ml-1">{step === 1 ? "Mobile" : "Shop Details"}</span>
            </div>

            {step === 1 && (
              <>
                <div>
                  <label className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2 block">Mobile Number</label>
                  <div className="flex items-center bg-white/8 border border-white/10 rounded-xl overflow-hidden focus-within:border-amber-400/50 transition-colors">
                    <span className="text-slate-400 pl-4 pr-2 text-sm">+91</span>
                    <input
                      className="flex-1 bg-transparent text-white py-3 pr-4 outline-none placeholder-slate-600 text-sm"
                      placeholder="98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      type="tel"
                      maxLength={15}
                      onKeyDown={(e) => e.key === "Enter" && handleRegisterStep1()}
                    />
                  </div>
                </div>

                {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}

                <button
                  onClick={handleRegisterStep1}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold py-3 rounded-xl transition-all text-sm active:scale-95"
                >
                  Continue →
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2 block">Shop Name</label>
                  <input
                    className="w-full bg-white/8 border border-white/10 rounded-xl text-white py-3 px-4 outline-none placeholder-slate-600 text-sm focus:border-amber-400/50 transition-colors"
                    placeholder="e.g. Kumar Motors"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    autoFocus
                  />
                </div>

                {/* Owner contact number for customers */}
                <div>
                  <label className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2 block">
                    Customer Contact Number
                  </label>
                  <div className="flex items-center bg-white/8 border border-white/10 rounded-xl overflow-hidden focus-within:border-amber-400/50 transition-colors">
                    <span className="text-slate-400 pl-4 pr-2 text-sm">+91</span>
                    <input
                      className="flex-1 bg-transparent text-white py-3 pr-4 outline-none placeholder-slate-600 text-sm"
                      placeholder="Number customers can call (default: login number)"
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      type="tel"
                      maxLength={15}
                      onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                    />
                  </div>
                  <p className="text-slate-600 text-xs mt-1.5 px-1">
                    This number appears as "Call Shop" on customer tracking pages
                  </p>
                </div>

                {/* Shop Logo */}
                <div>
                  <label className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2 block">Shop Logo (optional)</label>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImagePick} className="hidden" />

                  {shopImage ? (
                    <div className="relative">
                      <img src={shopImage} className="w-full h-28 object-cover rounded-xl" />
                      <button
                        onClick={() => { setShopImage(null); setShopImageFile(null); }}
                        className="absolute top-2 right-2 bg-slate-900/80 text-white text-xs rounded-lg px-2 py-1"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current.click()}
                      className="w-full border border-dashed border-white/20 rounded-xl py-6 text-slate-500 text-sm hover:border-amber-400/40 hover:text-slate-400 transition-colors flex flex-col items-center gap-2"
                    >
                      <span className="text-2xl">🏪</span>
                      <span>Add shop photo</span>
                    </button>
                  )}
                </div>

                {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}

                <div className="flex gap-2">
                  <button
                    onClick={() => { setStep(1); setError(""); }}
                    className="px-4 py-3 border border-white/10 rounded-xl text-slate-400 text-sm hover:text-white transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="flex-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-900 font-bold py-3 rounded-xl transition-all text-sm active:scale-95"
                  >
                    {loading ? "Registering..." : "Register Shop 🎉"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <p className="text-slate-600 text-xs mt-6 text-center">Secure · No password needed · Mobile-first</p>
    </div>
  );
}