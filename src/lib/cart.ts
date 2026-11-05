import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "./types";

type AddLine = Omit<CartLine, "key" | "qty"> & { qty?: number };

type CartState = {
  lines: CartLine[];
  wishlist: string[];
  add: (line: AddLine) => void;
  setQty: (key: string, qty: number) => void;
  updateOptions: (key: string, options: { shape: string; length: string; sizing: string }) => void;
  remove: (key: string) => void;
  clear: () => void;
  toggleWish: (id: string) => void;
};

function lineKey(line: { productId: string; shape: string; length: string; sizing: string }) {
  return [line.productId, line.shape, line.length, line.sizing].join("|");
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      wishlist: [],
      add: (line) => {
        const key = lineKey(line);
        const qty = Math.min(10, Math.max(1, line.qty ?? 1));
        const existing = get().lines.find((item) => item.key === key);
        if (existing) {
          set({
            lines: get().lines.map((item) =>
              item.key === key ? { ...item, qty: Math.min(10, item.qty + qty) } : item,
            ),
          });
          return;
        }
        set({ lines: [...get().lines, { ...line, key, qty }] });
      },
      setQty: (key, qty) =>
        set({
          lines:
            qty <= 0
              ? get().lines.filter((item) => item.key !== key)
              : get().lines.map((item) =>
                  item.key === key ? { ...item, qty: Math.min(10, qty) } : item,
                ),
        }),
      updateOptions: (key, options) => {
        const current = get().lines.find((item) => item.key === key);
        if (!current) return;
        const nextKey = lineKey({ productId: current.productId, ...options });
        const rest = get().lines.filter((item) => item.key !== key && item.key !== nextKey);
        const twin = get().lines.find((item) => item.key === nextKey && item.key !== key);
        const qty = Math.min(10, current.qty + (twin?.qty ?? 0));
        set({ lines: [...rest, { ...current, ...options, key: nextKey, qty }] });
      },
      remove: (key) => set({ lines: get().lines.filter((item) => item.key !== key) }),
      clear: () => set({ lines: [] }),
      toggleWish: (id) => {
        const has = get().wishlist.includes(id);
        set({
          wishlist: has ? get().wishlist.filter((item) => item !== id) : [...get().wishlist, id],
        });
      },
    }),
    { name: "glam-nails-cart" },
  ),
);

export function useCartHydrated() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const unsub = useCart.persist.onFinishHydration(() => setReady(true));
    if (useCart.persist.hasHydrated()) setReady(true);
    return unsub;
  }, []);
  return ready;
}
