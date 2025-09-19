// hooks/useConfirm.js
import { createContext, useContext, useState, useCallback } from "react";

const ConfirmCtx = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false });

  const ask = useCallback(({ title, description, onConfirm, meta }) => {
    setState({ open: true, title, description, onConfirm, meta });
  }, []);

  const close = useCallback(() => setState({ open: false }), []);
  const confirm = useCallback(async () => {
    const fn = state.onConfirm;
    setState({ open: false });
    if (fn) await fn(state.meta);
  }, [state]);

  return (
    <ConfirmCtx.Provider value={{ ask, close, state, confirm }}>
      {children}
    </ConfirmCtx.Provider>
  );
}

export function useConfirm() { return useContext(ConfirmCtx); }
