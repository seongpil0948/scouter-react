"use client";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

import { useEffect } from "react";
import { useFilterStore } from "@/lib/store/telemetryStore";
import DateRangePicker from "@/components/shared/DateRangePicker";
import { ThemeSwitch } from "@/components/shared/theme-switch";
import TraceVisualization from '@/components/traces/TraceVisualization';
import { useChartStore } from '@/lib/store/chartStore';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const router = useRouter();
  const { timeRange } = useFilterStore();
  const [chartConfig] = useState({
    height: 400,
    title: "실시간 요청 지연 시간",
    latencyThreshold: 300,
    autoUpdate: false,
    colors: {
      low: "#52c41a", // 낮은 지연시간
      medium: "#1890ff", // 보통 지연시간
      high: "#faad14", // 높은 지연시간
      critical: "#ff4d4f", // 임계치 초과 지연시간
      effectScatter: "#ff4d4f", // 고지연 요청 색상
    },
  });

  // 메트릭 데이터 가져오기
  const { data,  error, mutate } = useSWR<DtoTrace>(
    `/api/telemetry/traces?startTime=${timeRange.startTime}&endTime=${timeRange.endTime}`,
    fetcher,
    { refreshInterval: 30000 }, // 30초마다 자동 갱신
  );

  const handleTraceClick = useCallback((trace: TraceItem) => {
    router.push(`/traces/${trace.traceId}`);
  }, [router]);

  const handleRefresh = () => Promise.resolve(mutate());

  const handleTimeRangeChange = useCallback((startTime: number, endTime: number) => {
    // DateRangePicker에서 시간 범위가 변경되면 데이터 다시 로드
    mutate();
  }, [mutate]);

  const { updateConfig } = useChartStore();
  
  // 컴포넌트 마운트 시 차트 설정 초기화
  useEffect(() => {
    updateConfig(chartConfig);
  }, [chartConfig, updateConfig]);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <h1 className="text-xl font-bold">트레이스 모니터링 대시보드</h1>
      </div>
      <ThemeSwitch className="absolute top-4 right-4" />
      <DateRangePicker onChange={handleTimeRangeChange} />
      <TraceVisualization
        config={{
          ...chartConfig,
          title: error ? "데이터 로드 중 오류 발생" : chartConfig.title
        }}
        traceData={data?.traces ?? []}
        onDataPointClick={handleTraceClick}
        onRefresh={handleRefresh}
        showFilters={true}
      />
    </section>
  );
}