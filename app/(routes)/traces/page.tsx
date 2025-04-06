"use client";

import { useEffect, useCallback } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useFilterStore } from "@/lib/store/telemetryStore";
import { useChartStore } from '@/lib/store/chartStore';
import TraceVisualization from '@/components/traces/TraceVisualization';
import DateRangePicker from "@/components/shared/DateRangePicker";
import { ThemeSwitch } from "@/components/shared/theme-switch";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Dashboard() {
  const router = useRouter();
  const { timeRange } = useFilterStore();
  const { updateConfig } = useChartStore();
  
  // Initialize chart configuration
  useEffect(() => {
    updateConfig({
      height: 400,
      title: "실시간 요청 지연 시간",
      latencyThreshold: 300,
      maxDataPoints: 100,
      autoUpdate: false,
      colors: {
        low: "#52c41a", // 낮은 지연시간
        medium: "#1890ff", // 보통 지연시간
        high: "#faad14", // 높은 지연시간
        critical: "#ff4d4f", // 임계치 초과 지연시간
        error: "#ff4d4f" // 에러 상태 색상
      }
    });
  }, [updateConfig]);

  // Fetch trace data
  const { data, isLoading, error, mutate } = useSWR<DtoTrace>(
    `/api/telemetry/traces?startTime=${timeRange.startTime}&endTime=${timeRange.endTime}`,
    fetcher,
    { refreshInterval: 30000 }, // Auto-refresh every 30 seconds
  );

  // Handle trace item selection
  const handleTraceClick = useCallback((trace: TraceItem) => {
    router.push(`/traces/${trace.traceId}`);
  }, [router]);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    return mutate();
  }, [mutate]);

  // Handle time range changes
  const handleTimeRangeChange = useCallback((startTime: number, endTime: number) => {
    // Reload data when time range changes
    mutate();
  }, [mutate]);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <h1 className="text-xl font-bold">트레이스 모니터링 대시보드</h1>
      </div>
      
      <ThemeSwitch className="absolute top-4 right-4" />
      
      <DateRangePicker onChange={handleTimeRangeChange} />
      
      <TraceVisualization
        traceData={data?.traces ?? []}
        onDataPointClick={handleTraceClick}
        onRefresh={handleRefresh}
        title={error ? "데이터 로드 중 오류 발생" : undefined}
        showFilters={true}
      />
    </section>
  );
}