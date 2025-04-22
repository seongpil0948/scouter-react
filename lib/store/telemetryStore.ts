// lib/store/telemetryStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// Get default time range (last hour)
const getDefaultTimeRange = () => {
  const now = Date.now();
  return {
    startTime: now - 3600000, // 1 hour ago
    endTime: now,
  };
};

// Default filter values
const genDefaultFilter = () => ({
  service: null,
  severity: null,
  search: "",
  status: null,
  hasTrace: false,
  startTime: 0,
  endTime: 0,
  attributeKey: null,
});

const DEFAULT_LOG_FILTERS: LogFilters = genDefaultFilter();
const DEFAULT_TRACE_FILTERS = genDefaultFilter() as TraceFilters;

// Create filter store with improved time range management
export const useFilterStore = create<FilterStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Log filters
        logFilters: DEFAULT_LOG_FILTERS,
        setLogFilters: (filters) =>
          set((state) => ({
            logFilters: { ...state.logFilters, ...filters },
          })),
        resetLogFilters: () => set({ logFilters: DEFAULT_LOG_FILTERS }),

        // Trace filters
        traceFilters: DEFAULT_TRACE_FILTERS,
        setTraceFilters: (filters) =>
          set((state) => ({
            traceFilters: { ...state.traceFilters, ...filters },
          })),
        resetTraceFilters: () => set({ traceFilters: DEFAULT_TRACE_FILTERS }),

        // Time range with validation
        timeRange: getDefaultTimeRange(),
        setTimeRange: (startTime, endTime) => {
          // Input validation
          if (
            typeof startTime !== "number" ||
            typeof endTime !== "number" ||
            startTime <= 0 ||
            endTime <= 0 ||
            startTime >= endTime
          ) {
            console.warn("[FilterStore] Invalid time range:", {
              startTime,
              endTime,
            });

            // Use default range if invalid
            const defaultRange = getDefaultTimeRange();
            startTime = defaultRange.startTime;
            endTime = defaultRange.endTime;
          }

          // Update time range
          const prevTimeRange = get().timeRange;
          const hasChanged =
            Math.abs(prevTimeRange.startTime - startTime) > 1000 ||
            Math.abs(prevTimeRange.endTime - endTime) > 1000;

          if (hasChanged) {
            console.log(
              `[FilterStore] Time range updated: ${new Date(startTime).toLocaleString()} - ${new Date(endTime).toLocaleString()}`
            );

            set({ timeRange: { startTime, endTime } });
            return true;
          }

          return false;
        },

        // Selection state
        selectedTraceId: null,
        setSelectedTraceId: (id) => set({ selectedTraceId: id }),

        selectedLogId: null,
        setSelectedLogId: (id) => set({ selectedLogId: id }),

        selectedService: null,
        setSelectedService: (name) => set({ selectedService: name }),

        // Realtime mode state
        isRealtime: false,
        setIsRealtime: (isRealtime) => set({ isRealtime }),

        // Realtime settings
        refreshInterval: 5 as RefreshIntervalOption,
        setRefreshInterval: (interval) => set({ refreshInterval: interval }),

        realtimeRange: 5 as RealtimeRangeOption,
        setRealtimeRange: (range) => set({ realtimeRange: range }),

        // Toggle realtime mode with proper time range update
        toggleRealtime: (enabled) => {
          const currentIsRealtime = get().isRealtime;
          const newIsRealtime =
            enabled !== undefined ? enabled : !currentIsRealtime;

          // Skip if no change
          if (newIsRealtime === currentIsRealtime) return;

          console.log(
            `[FilterStore] Realtime mode ${newIsRealtime ? "enabled" : "disabled"}`
          );

          // Update time range when enabling realtime
          if (newIsRealtime) {
            const now = Date.now();
            const rangeInMs = get().realtimeRange * 60 * 1000;

            set({
              isRealtime: true,
              timeRange: {
                startTime: now - rangeInMs,
                endTime: now,
              },
            });
          } else {
            // Just disable realtime mode
            set({ isRealtime: false });
          }
        },
      }),
      {
        name: "telemetry-filter-storage",
        partialize: (state) => ({
          logFilters: state.logFilters,
          traceFilters: state.traceFilters,
          timeRange: state.timeRange,
          refreshInterval: state.refreshInterval,
          realtimeRange: state.realtimeRange,
          isRealtime: false, // Always start with realtime disabled
        }),
      }
    )
  )
);

export default useFilterStore;
