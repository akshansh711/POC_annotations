"use client";

import { setupListeners } from "@reduxjs/toolkit/query";
import { useEffect, useRef, useMemo, ReactNode, JSX } from "react";
import { Provider } from "react-redux";

import { store, type AppStore } from "../redux/store";

interface Props {
  readonly children: ReactNode;
}

export const StoreProvider = ({ children }: Props): JSX.Element => {
  const storeInstance = useMemo(() => store(), []);
  const storeRef = useRef<AppStore>(storeInstance);

  useEffect(() => {
    if (storeRef.current != null) {
      const unsubscribe = setupListeners(storeRef.current.dispatch);
      return unsubscribe;
    }
  }, []);

  return <Provider store={storeInstance}>{children}</Provider>;
};
