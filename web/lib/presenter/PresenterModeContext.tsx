"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface PresenterModeContextValue {
  showExplanations: boolean;
  toggle: () => void;
}

const PresenterModeContext = createContext<PresenterModeContextValue | null>(null);

export function PresenterModeProvider({ children }: { children: ReactNode }) {
  const [showExplanations, setShowExplanations] = useState(false);
  return (
    <PresenterModeContext.Provider
      value={{ showExplanations, toggle: () => setShowExplanations((v) => !v) }}
    >
      {children}
    </PresenterModeContext.Provider>
  );
}

export function usePresenterMode(): PresenterModeContextValue {
  const ctx = useContext(PresenterModeContext);
  if (!ctx) throw new Error("usePresenterMode must be used within a PresenterModeProvider");
  return ctx;
}
