import { StateCreator } from "zustand";

export interface LoadingSlice {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  status: "idle" | "loading" | "success" | "error";
  setStatus: (status: "idle" | "loading" | "success" | "error") => void;

  error: Error | null;
  setError: (error: Error | null) => void;
}

export const createLoadingSlice: StateCreator<
  LoadingSlice,
  [],
  [],
  LoadingSlice
> = (set) => ({
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),

  status: "idle",
  setStatus: (status) => set({ status }),

  error: null,
  setError: (error) => set({ error }),
});
