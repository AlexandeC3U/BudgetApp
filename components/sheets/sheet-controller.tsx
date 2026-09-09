"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type SheetName =
  | "addTxn"
  | "editTxn"
  | "categories"
  | "settle"
  | "invite"
  | "newTab"
  | "editTab"
  | "editProfile";

type SheetState = {
  name: SheetName | null;
  params?: { txnId?: string; tabId?: string };
};

type Ctx = {
  state: SheetState;
  open: (name: SheetName, params?: SheetState["params"]) => void;
  close: () => void;
  celebrate: boolean;
  triggerCelebrate: () => void;
};

const SheetCtx = createContext<Ctx | null>(null);

export function SheetProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SheetState>({ name: null });
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (!celebrate) return;
    const id = setTimeout(() => setCelebrate(false), 1800);
    return () => clearTimeout(id);
  }, [celebrate]);

  return (
    <SheetCtx.Provider
      value={{
        state,
        open: (name, params) => setState({ name, params }),
        close: () => setState({ name: null }),
        celebrate,
        triggerCelebrate: () => setCelebrate(true),
      }}
    >
      {children}
    </SheetCtx.Provider>
  );
}

export function useSheet(): Ctx {
  const ctx = useContext(SheetCtx);
  if (!ctx) throw new Error("useSheet must be used inside <SheetProvider>");
  return ctx;
}
