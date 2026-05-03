import { create } from "zustand";

type ToastTone = "success" | "error" | "info";

export type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastState = {
  items: ToastItem[];
  pushToast: (message: string, tone?: ToastTone) => void;
  dismissToast: (id: number) => void;
};

let nextToastId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  items: [],
  pushToast: (message, tone = "info") => {
    const id = nextToastId++;
    set((state) => ({ items: [...state.items, { id, message, tone }] }));
    window.setTimeout(() => {
      get().dismissToast(id);
    }, 3200);
  },
  dismissToast: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
}));
