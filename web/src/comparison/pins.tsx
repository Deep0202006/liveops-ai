import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

export const MAX_PINNED_ASSETS = 3;
type PinResult = { ok: true } | { ok: false; reason: string };
type PinsContextValue = {
  pins: string[];
  pin: (assetId: string) => PinResult;
  unpin: (assetId: string) => void;
  replace: (previousId: string, nextId: string) => PinResult;
  clear: () => void;
  retainValid: (validIds: string[]) => void;
};

const PinsContext = createContext<PinsContextValue | null>(null);

export function PinsProvider({ children }: { children: ReactNode }) {
  const [pins, setPins] = useState<string[]>([]);
  const pinsRef = useRef<string[]>([]);
  const updatePins = useCallback((next: string[]) => { pinsRef.current = next; setPins(next); }, []);
  const pin = useCallback((assetId: string): PinResult => {
    const current=pinsRef.current;
    if (current.includes(assetId)) return { ok: true };
    if (current.length >= MAX_PINNED_ASSETS) return { ok: false, reason: `Up to ${MAX_PINNED_ASSETS} assets can be compared. Remove or replace a pinned asset first.` };
    updatePins([...current,assetId]);return { ok: true };
  }, [updatePins]);
  const unpin = useCallback((assetId: string) => updatePins(pinsRef.current.filter((id) => id !== assetId)), [updatePins]);
  const replace = useCallback((previousId: string, nextId: string): PinResult => {
    updatePins(pinsRef.current.map((id) => id === previousId ? nextId : id).filter((id, index, all) => all.indexOf(id) === index));
    return { ok: true };
  }, [updatePins]);
  const clear = useCallback(() => updatePins([]), [updatePins]);
  const retainValid = useCallback((validIds: string[]) => {const current=pinsRef.current;const next=current.filter((id) => validIds.includes(id));if(next.length!==current.length)updatePins(next)}, [updatePins]);
  const value = useMemo(() => ({ pins, pin, unpin, replace, clear, retainValid }), [pins, pin, unpin, replace, clear, retainValid]);
  return <PinsContext.Provider value={value}>{children}</PinsContext.Provider>;
}

// Provider and hook intentionally live together so the pin API has one source of truth.
// eslint-disable-next-line react-refresh/only-export-components
export function usePins() {
  const value = useContext(PinsContext);
  if (!value) throw new Error("usePins must be used within PinsProvider");
  return value;
}
