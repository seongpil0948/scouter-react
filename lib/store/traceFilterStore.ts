// lib/store/traceFilterStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { TIME_RANGE_MS } from "./chartStore";

// Default filter values
const DEFAULT_FILTERS = {
  searchQuery: "",
  limit: 500 as LimitOption,
  selectedServices: [],
  selectedStatuses: [],
  minDuration: undefined,
  maxDuration: undefined,
  attributeKey: "",
  rootSpansOnly: true, // Default to root spans only
  timeRangeOption: "1h" as keyof typeof TIME_RANGE_MS,
  sortField: "startTime" as SortField,
  sortDirection: "desc" as SortDirection,
  lastRefreshed: Date.now(),
};

// Create trace filter store with improved refresh handling
export const useTraceFilterStore = create<TraceFilterStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Default values
        ...DEFAULT_FILTERS,

        // Search query
        setSearchQuery: (query) => {
          set({ searchQuery: query });
          console.log(`[traceFilterStore] Search query set to: "${query}"`);
        },

        // Result limit
        setLimit: (limit) => {
          set({ limit });
          console.log(`[traceFilterStore] Result limit set to: ${limit}`);
        },

        // Service filters
        setSelectedServices: (services) => {
          set({ selectedServices: services });
          console.log(
            `[traceFilterStore] Selected services: ${services.join(", ") || "none"}`
          );
        },

        addService: (service) =>
          set((state) => {
            if (state.selectedServices.includes(service)) return state;
            return {
              selectedServices: [...state.selectedServices, service],
            };
          }),

        removeService: (service) =>
          set((state) => ({
            selectedServices: state.selectedServices.filter(
              (s) => s !== service
            ),
          })),

        clearServices: () => set({ selectedServices: [] }),

        // Status filters
        setSelectedStatuses: (statuses) => {
          set({ selectedStatuses: statuses });
          console.log(
            `[traceFilterStore] Selected statuses: ${statuses.join(", ") || "none"}`
          );
        },

        addStatus: (status) =>
          set((state) => {
            if (state.selectedStatuses.includes(status)) return state;
            return {
              selectedStatuses: [...state.selectedStatuses, status],
            };
          }),

        removeStatus: (status) =>
          set((state) => ({
            selectedStatuses: state.selectedStatuses.filter(
              (s) => s !== status
            ),
          })),

        clearStatuses: () => set({ selectedStatuses: [] }),

        // Duration filters
        setMinDuration: (duration) => {
          set({ minDuration: duration });
          console.log(
            `[traceFilterStore] Min duration set to: ${duration ?? "none"}`
          );
        },

        setMaxDuration: (duration) => {
          set({ maxDuration: duration });
          console.log(
            `[traceFilterStore] Max duration set to: ${duration ?? "none"}`
          );
        },

        // Attribute key filter
        setAttributeKey: (key) => {
          const trimmedKey = key.trim();
          set({ attributeKey: trimmedKey });
          if (trimmedKey) {
            console.log(
              `[traceFilterStore] Attribute key set to: "${trimmedKey}"`
            );
          }
        },

        // Root spans only filter
        setRootSpansOnly: (rootOnly) => {
          set({ rootSpansOnly: rootOnly });
          console.log(`[traceFilterStore] Root spans only: ${rootOnly}`);
        },

        // Time range option
        setTimeRangeOption: (option) => set({ timeRangeOption: option }),

        // Sorting
        setSorting: (field, direction) =>
          set({
            sortField: field,
            sortDirection: direction,
          }),

        // Reset all filters
        resetAllFilters: () => {
          console.log("[traceFilterStore] Resetting all filters to defaults");
          set({
            ...DEFAULT_FILTERS,
            lastRefreshed: Date.now(),
          });
        },

        // Trigger refresh
        refreshData: () => {
          console.log("[traceFilterStore] Refresh triggered");
          set({ lastRefreshed: Date.now() });
        },

        // Check if any filters are active
        hasActiveFilters: () => {
          const state = get();
          return (
            state.selectedServices.length > 0 ||
            state.selectedStatuses.length > 0 ||
            state.searchQuery !== "" ||
            state.attributeKey !== "" ||
            state.minDuration !== undefined ||
            state.maxDuration !== undefined ||
            state.rootSpansOnly !== DEFAULT_FILTERS.rootSpansOnly ||
            state.limit !== DEFAULT_FILTERS.limit
          );
        },
      }),
      {
        name: "trace-filter-storage",
        partialize: (state) => ({
          searchQuery: state.searchQuery,
          limit: state.limit,
          selectedServices: state.selectedServices,
          selectedStatuses: state.selectedStatuses,
          minDuration: state.minDuration,
          maxDuration: state.maxDuration,
          attributeKey: state.attributeKey,
          rootSpansOnly: state.rootSpansOnly,
          timeRangeOption: state.timeRangeOption,
          sortField: state.sortField,
          sortDirection: state.sortDirection,
        }),
      }
    )
  )
);
