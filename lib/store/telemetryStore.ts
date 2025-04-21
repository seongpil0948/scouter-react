import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// 기본 시간 범위 생성 - 지난 1시간
const getDefaultTimeRange = () => {
  const now = Date.now();
  return {
    startTime: now - 3600000, // 1시간 전
    endTime: now,
  };
};

// 기본 필터 값 생성 함수 (기존 코드 유지)
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

// 기본 필터 값 (기존 코드 유지)
const DEFAULT_LOG_FILTERS: LogFilters = genDefaultFilter();
const DEFAULT_TRACE_FILTERS = genDefaultFilter() as TraceFilters;

// 필터 스토어 생성 - 실시간 모드 관련 기능 추가
export const useFilterStore = create<FilterStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 기존 상태와 함수들 유지
        logFilters: DEFAULT_LOG_FILTERS,
        setLogFilters: (filters) =>
          set((state) => ({
            logFilters: { ...state.logFilters, ...filters },
          })),
        resetLogFilters: () => set({ logFilters: DEFAULT_LOG_FILTERS }),

        traceFilters: DEFAULT_TRACE_FILTERS,
        setTraceFilters: (filters) =>
          set((state) => ({
            traceFilters: { ...state.traceFilters, ...filters },
          })),
        resetTraceFilters: () => set({ traceFilters: DEFAULT_TRACE_FILTERS }),

        // 기본값으로 지난 1시간 데이터를 보도록 설정
        timeRange: getDefaultTimeRange(),
        // 시간 범위 설정 함수 수정
        setTimeRange: (startTime, endTime) => {
          // 유효성 검사 개선
          if (
            typeof startTime !== "number" ||
            typeof endTime !== "number" ||
            startTime <= 0 ||
            endTime <= 0 ||
            startTime >= endTime
          ) {
            console.warn("[FilterStore] 유효하지 않은 시간 범위:", {
              startTime,
              endTime,
            });
            // 유효하지 않은 경우 기본값 사용
            const now = Date.now();
            startTime = now - 3600000; // 1시간 전
            endTime = now;
          }

          set({ timeRange: { startTime, endTime } });
          console.log(
            `[FilterStore] 시간 범위 업데이트: ${new Date(startTime).toLocaleString()} - ${new Date(endTime).toLocaleString()}`
          );
        },

        selectedTraceId: null,
        setSelectedTraceId: (id) => set({ selectedTraceId: id }),

        selectedLogId: null,
        setSelectedLogId: (id) => set({ selectedLogId: id }),

        selectedService: null,
        setSelectedService: (name) => set({ selectedService: name }),

        // 기존 실시간 모드 상태
        isRealtime: false,
        setIsRealtime: (isRealtime) => set({ isRealtime }),

        // 추가: 실시간 모드 기본 설정
        refreshInterval: 5 as RefreshIntervalOption,
        setRefreshInterval: (interval) => set({ refreshInterval: interval }),

        realtimeRange: 5 as RealtimeRangeOption,
        setRealtimeRange: (range) => set({ realtimeRange: range }),

        // 추가: 실시간 모드 토글 함수
        toggleRealtime: (enabled) => {
          const currentIsRealtime = get().isRealtime;
          // enabled가 제공되면 해당 값으로, 아니면 현재 상태의 반대로 설정
          const newIsRealtime =
            enabled !== undefined ? enabled : !currentIsRealtime;

          // 현재 상태와 같으면 변경하지 않음
          if (newIsRealtime === currentIsRealtime) return;

          console.log(
            `[FilterStore] 실시간 모드 ${newIsRealtime ? "활성화" : "비활성화"}`
          );

          // 실시간 모드 활성화 시 현재 시간 기준으로 시간 범위 업데이트
          if (newIsRealtime) {
            const now = Date.now();
            const rangeInMs = get().realtimeRange * 60 * 1000; // 분 -> 밀리초

            set({
              isRealtime: true,
              timeRange: {
                startTime: now - rangeInMs,
                endTime: now,
              },
            });
          } else {
            // 실시간 모드 비활성화만 수행
            set({ isRealtime: false });
          }
        },
      }),
      {
        name: "telemetry-filter-storage",
        partialize: (state) => ({
          // 기존 저장 필드 유지
          logFilters: state.logFilters,
          traceFilters: state.traceFilters,
          // 중요: timeRange를 명시적으로 저장
          timeRange: state.timeRange,
          // 실시간 모드는 기본적으로 off로 저장
          isRealtime: false,
          // 추가: 설정 값은 저장
          refreshInterval: state.refreshInterval,
          realtimeRange: state.realtimeRange,
        }),
        // storage 설정 - 로컬 스토리지에 저장
        storage: {
          getItem: (name) => {
            const value = localStorage.getItem(name);
            if (value) {
              try {
                return JSON.parse(value);
              } catch (e) {
                console.error(
                  `[FilterStore] Error parsing storage item ${name}:`,
                  e
                );
                return null;
              }
            }
            return null;
          },
          setItem: (name, value) => {
            try {
              localStorage.setItem(name, JSON.stringify(value));
            } catch (e) {
              console.error(`[FilterStore] Error storing item ${name}:`, e);
            }
          },
          removeItem: (name) => {
            try {
              localStorage.removeItem(name);
            } catch (e) {
              console.error(`[FilterStore] Error removing item ${name}:`, e);
            }
          },
        },
        // 로드 시 마이그레이션 추가
        onRehydrateStorage: (state) => {
          return (hydrated, error) => {
            if (error) {
              console.error("[FilterStore] Failed to rehydrate state:", error);
            }

            if (hydrated) {
              // 유효한 시간 범위가 없으면 기본값 설정
              const { timeRange } = hydrated;
              if (
                !timeRange ||
                !timeRange.startTime ||
                !timeRange.endTime ||
                timeRange.startTime <= 0 ||
                timeRange.endTime <= 0 ||
                timeRange.startTime >= timeRange.endTime
              ) {
                console.log(
                  "[FilterStore] Setting default time range on rehydration"
                );
                hydrated.setTimeRange(
                  getDefaultTimeRange().startTime,
                  getDefaultTimeRange().endTime
                );
              } else {
                console.log(
                  "[FilterStore] Rehydrated with time range:",
                  new Date(timeRange.startTime).toLocaleString(),
                  new Date(timeRange.endTime).toLocaleString()
                );
              }
            }
          };
        },
      }
    )
  )
);
