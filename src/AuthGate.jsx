import { useAuth } from "./AuthContext";
import AuthScreen from "./AuthScreen";

export default function AuthGate({ children }) {
  const { shopData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-amber-400/20 rounded-2xl flex items-center justify-center mx-auto mb-3 animate-pulse">
            <span className="text-2xl">🔧</span>
          </div>
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!shopData) {
    return <AuthScreen />;
  }

  return children;
}
