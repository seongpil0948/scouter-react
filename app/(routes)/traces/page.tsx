"use client";

import { useEffect, useCallback, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { ThemeSwitch } from "@/components/shared/theme-switch";
import TraceVisualization from '@/components/traces/TraceVisualization';
import { useChartStore, getTimeRangeForQuery } from '@/lib/store/chartStore';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Dashboard() {
  const router = useRouter();
  const { updateConfig, timeRange, refreshInterval, autoRefreshEnabled } = useChartStore();
  const [isInitialized, setIsInitialized] = useState(false);
  
  const timeRangeForQuery = getTimeRangeForQuery();
  const { data, error, mutate } = useSWR<DtoTrace>(
    `/api/telemetry/traces?startTime=${timeRangeForQuery.startTime}&endTime=${timeRangeForQuery.endTime}`,
    fetcher,
    { 
      refreshInterval: autoRefreshEnabled ? refreshInterval : 0, // Only enable auto refresh if enabled in store
      revalidateOnFocus: false,
      dedupingInterval: 1000, // Prevent duplicate requests within 1 second
    },
  );

  // Initialize chart configuration
  useEffect(() => {
    if (!isInitialized) {
      updateConfig({
        height: 400,
        title: "실시간 요청 지연 시간 모니터링",
        latencyThreshold: 300,
        maxDataPoints: 100,
        colors: {
          low: "#52c41a", // 낮은 지연시간
          medium: "#1890ff", // 보통 지연시간
          high: "#faad14", // 높은 지연시간
          critical: "#ff4d4f", // 임계치 초과 지연시간
          error: "#ff4d4f" // 에러 상태 색상
        }
      });
      setIsInitialized(true);
    }
  }, [updateConfig, isInitialized]);

  // Handle trace item selection
  const handleTraceClick = useCallback((trace: TraceItem) => {
    router.push(`/traces/${trace.traceId}`);
  }, [router]);

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    return mutate();
  }, [mutate]);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <h1 className="text-xl font-bold">트레이스 모니터링 대시보드</h1>
        <p className="text-gray-500 text-sm mt-1">실시간 지연 시간 및 오류 모니터링</p>
      </div>
      
      <ThemeSwitch className="absolute top-4 right-4" />
      
      <div className="w-full max-w-7xl">
        <TraceVisualization
          traceData={data?.traces ?? []}
          onDataPointClick={handleTraceClick}
          onRefresh={handleRefresh}
          title={error ? "데이터 로드 중 오류 발생" : undefined}
          showFilters={true}
        />
      </div>
    </section>
  );
}