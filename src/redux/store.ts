import { configureStore } from "@reduxjs/toolkit";
import { Middleware, isRejected, isFulfilled, isPending } from "@reduxjs/toolkit";
import { pdfSlice } from "./slices/pdfSlice";

export const store = () => {
  return configureStore({
    reducer: {
        pdfSlice: pdfSlice.reducer
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false
      }).concat()
  });
};

export type AppStore = ReturnType<typeof store>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
