"use client";

/* eslint-disable react-hooks/set-state-in-effect -- read persisted session on mount */
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "eventflow-auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const isAuthenticated = Boolean(user);

  useEffect(() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    // Make sure it's actually a user object, not a primitive
    setUser(parsed && typeof parsed === "object" ? parsed : null);
  } catch {
    setUser(null);
  }
  setReady(true);
}, []);

  const login = useCallback(async (username, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok || !data?.user) return { ok: false, error: data?.error || "Invalid login." };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
    } catch {
      /* ignore */
    }
    setUser(data.user);
    return { ok: true, user: data.user };
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ ready, isAuthenticated, user, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
