import { StateCreator } from "zustand";

export interface LogDataSlice {
  logs: LogItem[];
  setLogs: (logs: LogItem[]) => void;
  addLogs: (logs: LogItem[]) => void;
  clearLogs: () => void;

  totalCount: number;
  setTotalCount: (count: number) => void;

  services: string[];
  setServices: (services: string[]) => void;

  severities: string[];
  setSeverities: (severities: string[]) => void;

  selectedLogId: string | null;
  setSelectedLogId: (id: string | null) => void;
}

export const createLogDataSlice: StateCreator<
  LogDataSlice,
  [],
  [],
  LogDataSlice
> = (set) => ({
  logs: [],
  setLogs: (logs) => set({ logs }),
  addLogs: (newLogs) =>
    set((state) => ({
      logs: [...state.logs, ...newLogs],
    })),
  clearLogs: () => set({ logs: [] }),

  totalCount: 0,
  setTotalCount: (count) => set({ totalCount: count }),

  services: [],
  setServices: (services) => set({ services }),

  severities: [],
  setSeverities: (severities) => set({ severities }),

  selectedLogId: null,
  setSelectedLogId: (id) => set({ selectedLogId: id }),
});
