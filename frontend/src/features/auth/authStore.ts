import { create } from "zustand";

import type { AuthSession, MeResponse } from "../../types/models";

type AuthState = {
  session: AuthSession | null;
  me: MeResponse | null;
  setSession: (session: AuthSession | null) => void;
  setMe: (me: MeResponse | null) => void;
  logout: () => void;
};

const storageKey = "kacoffee-auth";

function loadSession(): AuthSession | null {
  const raw = localStorage.getItem(storageKey);
  return raw ? (JSON.parse(raw) as AuthSession) : null;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: typeof window === "undefined" ? null : loadSession(),
  me: null,
  setSession: (session) => {
    if (session) {
      localStorage.setItem(storageKey, JSON.stringify(session));
    } else {
      localStorage.removeItem(storageKey);
    }
    set({ session });
  },
  setMe: (me) => set({ me }),
  logout: () => {
    localStorage.removeItem(storageKey);
    set({ session: null, me: null });
  }
}));
