'use client';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';

import { useFilterStore } from '@/lib/store/telemetryStore';
import DateRangePicker from '@/components/shared/DateRangePicker';
import { ThemeSwitch } from '@/components/shared/theme-switch';
import TraceVisualization from '@/components/traces/TraceVisualization';
import { useChartStore } from '@/lib/store/chartStore';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const router = useRouter();
  const { timeRange } = useFilterStore();
  const [chartConfig] = useState({
    height: 400,
    title: '실시간 요청 지연 시간',
    latencyThreshold: 300,
    colors: {
      low: '#52c41a', // 낮은 지연시간
      medium: '#1890ff', // 보통 지연시간
      high: '#faad14', // 높은 지연시간
      critical: '#ff4d4f', // 임계치 초과 지연시간
      error: '#ff4d4f', // 에러 상태 색상
    },
  });

  // 메트릭 데이터 가져오기 (refreshInterval을 SWR에 직접 전달)
  const { data, error, mutate } = useSWR<DtoTrace>(
    `/api/telemetry/traces?startTime=${timeRange.startTime}&endTime=${timeRange.endTime}`,
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      dedupingInterval: 1000,
    }
  );

  const handleTraceClick = useCallback(
    (trace: TraceItem) => {
      router.push(`/traces/${trace.traceId}`);
    },
    [router]
  );

  const handleTimeRangeChange = useCallback(() => {
    mutate();
  }, []);

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

      <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-7xl">
        <DateRangePicker onChange={handleTimeRangeChange} />
      </div>

      <TraceVisualization
        config={{
          ...chartConfig,
          title: error ? '데이터 로드 중 오류 발생' : chartConfig.title,
        }}
        traceData={data?.traces ?? []}
        onDataPointClick={handleTraceClick}
        showFilters={true}
      />
    </section>
  );
}
