import { createContext, useContext, useEffect, useState } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("shopSession");
    if (saved) {
      try {
        setShopData(JSON.parse(saved));
      } catch {
        localStorage.removeItem("shopSession");
      }
    }
    setLoading(false);
  }, []);

  // Register a new shop (owner)
  const register = async ({ phone, shopName, shopImage, ownerPhone }) => {
    const shopId = phone.replace(/\D/g, "");
    const shopRef = doc(db, "shops", shopId);
    const existing = await getDoc(shopRef);
    if (existing.exists()) throw new Error("ALREADY_REGISTERED");

    const contactPhone = ownerPhone || phone;

    const data = {
      phone,
      shopName,
      shopImage: shopImage || null,
      shopId,
      ownerPhone: contactPhone, // shown to customers as "Call Shop"
      createdAt: new Date().toISOString(),
    };
    await setDoc(shopRef, data);

    // Add owner as first staff member with admin role
    await setDoc(doc(db, "shops", shopId, "staff", shopId), {
      phone,
      name: "Owner",
      role: "admin",
      addedAt: new Date().toISOString(),
    });

    const session = {
      phone,
      shopName,
      shopImage: shopImage || null,
      shopId,
      ownerPhone: contactPhone,
      role: "admin",
      staffName: "Owner",
    };
    localStorage.setItem("shopSession", JSON.stringify(session));
    setShopData(session);
    return session;
  };

  // Login — checks if owner OR staff member
  const login = async (phone) => {
    const cleanPhone = phone.replace(/\D/g, "");

    // First try: is this an owner?
    const shopRef = doc(db, "shops", cleanPhone);
    const snap = await getDoc(shopRef);
    if (snap.exists()) {
      const data = snap.data();
      const session = {
        phone: data.phone,
        shopName: data.shopName,
        shopImage: data.shopImage || null,
        shopId: data.shopId,
        ownerPhone: data.ownerPhone || data.phone,
        role: "admin",
        staffName: "Owner",
      };
      localStorage.setItem("shopSession", JSON.stringify(session));
      setShopData(session);
      return session;
    }

    // Second try: is this a staff member in any shop?
    const staffIndexRef = doc(db, "staffIndex", cleanPhone);
    const staffIndexSnap = await getDoc(staffIndexRef);

    if (!staffIndexSnap.exists()) throw new Error("NOT_FOUND");

    const { shopId } = staffIndexSnap.data();
    const shopSnap = await getDoc(doc(db, "shops", shopId));
    if (!shopSnap.exists()) throw new Error("NOT_FOUND");

    const staffSnap = await getDoc(doc(db, "shops", shopId, "staff", cleanPhone));
    if (!staffSnap.exists()) throw new Error("NOT_FOUND");

    const shopInfo = shopSnap.data();
    const staffInfo = staffSnap.data();

    const session = {
      phone: staffInfo.phone,
      shopName: shopInfo.shopName,
      shopImage: shopInfo.shopImage || null,
      shopId,
      ownerPhone: shopInfo.ownerPhone || shopInfo.phone,
      role: staffInfo.role || "staff",
      staffName: staffInfo.name || "Staff",
    };
    localStorage.setItem("shopSession", JSON.stringify(session));
    setShopData(session);
    return session;
  };

  const logout = () => {
    localStorage.removeItem("shopSession");
    setShopData(null);
  };

  const updateProfile = async (updates) => {
    if (!shopData) return;
    const shopRef = doc(db, "shops", shopData.shopId);
    await setDoc(shopRef, updates, { merge: true });
    const updated = { ...shopData, ...updates };
    localStorage.setItem("shopSession", JSON.stringify(updated));
    setShopData(updated);
  };

  return (
    <AuthContext.Provider value={{ shopData, loading, register, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}