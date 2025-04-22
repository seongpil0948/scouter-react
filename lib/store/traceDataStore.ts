// lib/store/traceDataStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { buildTraceApiUrl } from "@/lib/utils/filterUtils";
import { useFilterStore } from "./telemetryStore";
import { useTraceFilterStore } from "./traceFilterStore";

// Types
export type TraceDataFetchStatus = "idle" | "loading" | "success" | "error";

interface TraceDataState {
  // Data
  traces: TraceItem[];
  totalCount: number;

  // Fetch status
  status: TraceDataFetchStatus;
  error: Error | null;
  lastFetched: number;
  isValidating: boolean;

  // Pagination
  currentPage: number;
  pageSize: number;

  // Selection
  selectedTraceId: string | null;

  // Actions
  fetchTraces: (forceRefresh?: boolean) => Promise<void>;
  setTraces: (traces: TraceItem[], total: number) => void;
  setError: (error: Error | null) => void;
  setStatus: (status: TraceDataFetchStatus) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSelectedTraceId: (id: string | null) => void;
  resetTraceData: () => void;
}

// API fetcher
const fetchTraceData = async (url: string): Promise<TracesResponse> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("[traceDataStore] Error fetching trace data:", error);
    throw error;
  }
};

// Create the store
export const useTraceDataStore = create<TraceDataState>()(
  devtools(
    (set, get) => ({
      // Initial state
      traces: [],
      totalCount: 0,
      status: "idle",
      error: null,
      lastFetched: 0,
      isValidating: false,
      currentPage: 1,
      pageSize: 100,
      selectedTraceId: null,

      // Actions
      fetchTraces: async (forceRefresh = false) => {
        const currentState = get();

        // Avoid duplicate fetches when already loading
        if (currentState.status === "loading" && !forceRefresh) {
          console.log(
            "[traceDataStore] Already fetching data, skipping duplicate request"
          );
          return;
        }

        // Get current filter state from other stores
        const { timeRange, isRealtime } = useFilterStore.getState();
        const {
          searchQuery,
          selectedServices,
          selectedStatuses,
          minDuration,
          maxDuration,
          limit,
          sortField,
          sortDirection,
          attributeKey,
          rootSpansOnly,
        } = useTraceFilterStore.getState();

        // Calculate offset from current page
        const offset = (currentState.currentPage - 1) * currentState.pageSize;

        // Set loading state
        set({ status: "loading", isValidating: true });

        try {
          // Build API URL with all filters
          const apiUrl = buildTraceApiUrl(
            "/api/telemetry/traces",
            {
              searchQuery,
              selectedServices,
              selectedStatuses,
              minDuration,
              maxDuration,
              attributeKey,
            },
            timeRange,
            limit,
            sortField,
            sortDirection,
            offset,
            { rootSpansOnly }
          );

          console.log(
            "[traceDataStore] Fetching trace data:",
            apiUrl.slice(0, 100) + "..."
          );

          // Fetch data from API
          const response = await fetchTraceData(apiUrl);

          // Update state with fetched data
          set({
            traces: response.traces || [],
            totalCount: response.total || 0,
            status: "success",
            error: null,
            lastFetched: Date.now(),
            isValidating: false,
          });

          console.log(
            `[traceDataStore] Fetched ${response.traces?.length || 0} traces out of ${response.total || 0}`
          );
        } catch (error) {
          console.error("[traceDataStore] Error fetching traces:", error);
          set({
            status: "error",
            error: error instanceof Error ? error : new Error(String(error)),
            isValidating: false,
          });
        }
      },

      setTraces: (traces, total) =>
        set({
          traces,
          totalCount: total,
          status: "success",
          lastFetched: Date.now(),
        }),

      setError: (error) =>
        set({ error, status: error ? "error" : get().status }),

      setStatus: (status) => set({ status }),

      setCurrentPage: (page) => {
        if (page !== get().currentPage) {
          set({ currentPage: page });
          get().fetchTraces();
        }
      },

      setPageSize: (size) => {
        if (size !== get().pageSize) {
          set({ pageSize: size, currentPage: 1 });
          get().fetchTraces();
        }
      },

      setSelectedTraceId: (id) => set({ selectedTraceId: id }),

      resetTraceData: () =>
        set({
          traces: [],
          totalCount: 0,
          status: "idle",
          error: null,
          currentPage: 1,
        }),
    }),
    { name: "trace-data-store" }
  )
);

// Selector hooks for easier access to specific parts of the state
export const useTraces = () => useTraceDataStore((state) => state.traces);
export const useTraceStatus = () => useTraceDataStore((state) => state.status);
export const useTraceError = () => useTraceDataStore((state) => state.error);
export const useSelectedTraceId = () =>
  useTraceDataStore((state) => state.selectedTraceId);
export const useTracePagination = () =>
  useTraceDataStore((state) => ({
    currentPage: state.currentPage,
    totalCount: state.totalCount,
    pageSize: state.pageSize,
    setCurrentPage: state.setCurrentPage,
    setPageSize: state.setPageSize,
  }));

export default useTraceDataStore;
