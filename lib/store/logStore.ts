// lib/store/logStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { buildLogApiUrl } from "@/lib/utils/filterUtils";
import { useFilterStore } from "@/lib/store/telemetryStore";

interface LogStore {
  logs: LogItem[];
  isLoading: boolean;
  error: Error | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  filters: LogFilter;
  selectedLogId: string | null;

  // Actions
  setFilters: (filters: Partial<LogFilter>) => void;
  setPage: (page: number) => void;
  fetchLogs: (force?: boolean) => Promise<void>;
  setSelectedLogId: (id: string | null) => void;
}

export const useLogStore = create<LogStore>()(
  devtools((set, get) => ({
    logs: [],
    isLoading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 100,
    selectedLogId: null,
    filters: {
      startTime: Date.now() - 3600000, // 1 hour ago
      endTime: Date.now(),
      serviceName: null,
      severity: null,
      hasTrace: false,
      limit: 100,
      offset: 0,
    },

    setFilters: (newFilters) => {
      set((state) => ({
        filters: { ...state.filters, ...newFilters },
        currentPage: 1, // Reset to first page when filters change
      }));
    },

    setPage: (page) => {
      if (page < 1) page = 1;
      set({ currentPage: page });
    },

    fetchLogs: async (force = false) => {
      const state = get();
      if (state.isLoading && !force) return;

      try {
        set({ isLoading: true });

        // Update time range from global store
        const { timeRange } = useFilterStore.getState();
        const filters = {
          ...state.filters,
          startTime: timeRange.startTime,
          endTime: timeRange.endTime,
        };

        // Calculate offset
        const offset = (state.currentPage - 1) * state.pageSize;

        // Build API URL
        const apiUrl = buildLogApiUrl(
          `${process.env.NEXT_PUBLIC_API_BASE_PATH}/telemetry/logs`,
          filters,
          offset
        );

        // Fetch data
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error?.message || "Unknown error");
        }

        // Update state
        set({
          logs: data.data.logs || [],
          totalCount: data.data.pagination.total || 0,
          error: null,
        });
      } catch (err) {
        console.error("[logStore] Error fetching logs:", err);
        set({
          error: err instanceof Error ? err : new Error(String(err)),
        });
      } finally {
        set({ isLoading: false });
      }
    },

    setSelectedLogId: (id) => set({ selectedLogId: id }),
  }))
);

export default useLogStore;
