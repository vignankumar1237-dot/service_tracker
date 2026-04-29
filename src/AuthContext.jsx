import { createContext, useContext, useEffect, useState } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [shopData, setShopData] = useState(null); // { phone, shopName, shopImage, shopId }
  const [loading, setLoading] = useState(true);

  // On mount, restore session from localStorage
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

  /**
   * Register a new shop
   */
  const register = async ({ phone, shopName, shopImage }) => {
    const shopId = phone.replace(/\D/g, ""); // use digits-only phone as ID
    const shopRef = doc(db, "shops", shopId);

    const existing = await getDoc(shopRef);
    if (existing.exists()) {
      throw new Error("ALREADY_REGISTERED");
    }

    const data = {
      phone,
      shopName,
      shopImage: shopImage || null,
      shopId,
      createdAt: new Date().toISOString(),
    };

    await setDoc(shopRef, data);

    const session = { phone, shopName, shopImage: shopImage || null, shopId };
    localStorage.setItem("shopSession", JSON.stringify(session));
    setShopData(session);
    return session;
  };

  /**
   * Login with existing mobile number
   */
  const login = async (phone) => {
    const shopId = phone.replace(/\D/g, "");
    const shopRef = doc(db, "shops", shopId);
    const snap = await getDoc(shopRef);

    if (!snap.exists()) {
      throw new Error("NOT_FOUND");
    }

    const data = snap.data();
    const session = {
      phone: data.phone,
      shopName: data.shopName,
      shopImage: data.shopImage || null,
      shopId: data.shopId,
    };

    localStorage.setItem("shopSession", JSON.stringify(session));
    setShopData(session);
    return session;
  };

  /**
   * Logout
   */
  const logout = () => {
    localStorage.removeItem("shopSession");
    setShopData(null);
  };

  /**
   * Update shop profile
   */
  const updateProfile = async (updates) => {
    if (!shopData) return;
    const shopRef = doc(db, "shops", shopData.shopId);
    await setDoc(shopRef, updates, { merge: true });

    const updated = { ...shopData, ...updates };
    localStorage.setItem("shopSession", JSON.stringify(updated));
    setShopData(updated);
  };

  return (
    <AuthContext.Provider
      value={{ shopData, loading, register, login, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
