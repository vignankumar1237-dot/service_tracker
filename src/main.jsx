import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { AuthProvider } from "./AuthContext";
import AuthGate from "./AuthGate";
import App from "./App";
import Track from "./Track";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route
          path="/"
          element={
            <AuthGate>
              <App />
            </AuthGate>
          }
        />
        <Route path="/track/:shopId/:id" element={<Track />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);
