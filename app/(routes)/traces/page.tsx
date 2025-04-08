'use client';

import { useCallback, useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { ThemeSwitch } from '@/components/shared/theme-switch';
import TraceVisualization from '@/components/traces/TraceVisualization';
import { useChartStore } from '@/lib/store/chartStore';
import { useFilterStore } from '@/lib/store/telemetryStore';
import DateRangePicker from '@/components/shared/DateRangePicker';
import { buildApiUrlWithFilters } from '@/lib/utils/filterUtils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Dashboard() {
  const router = useRouter();
  const [refreshInterval, setRefreshInterval] = useState<number>(0); // 기본 0 (자동 갱신 없음)
  const { dataFilters, updateConfig } = useChartStore();
  const { timeRange } = useFilterStore();

  // API URL 생성 - 필터 상태 반영
  const apiUrl = buildApiUrlWithFilters('/api/telemetry/traces', dataFilters, timeRange);

  // SWR을 사용하여 데이터 가져오기 (refreshInterval을 SWR에 직접 전달)
  const { data, error, mutate } = useSWR<DtoTrace>(apiUrl, fetcher, {
    refreshInterval: refreshInterval,
    revalidateOnFocus: false,
    dedupingInterval: 1000, // 1초 내 중복 요청 방지
  });

  // 초기화
  useState(() => {
    updateConfig({
      height: 400,
      title: '실시간 요청 지연 시간 모니터링',
      latencyThreshold: 300,
      colors: {
        low: '#52c41a', // 낮은 지연시간
        medium: '#1890ff', // 보통 지연시간
        high: '#faad14', // 높은 지연시간
        critical: '#ff4d4f', // 임계치 초과 지연시간
        error: '#ff4d4f', // 에러 상태 색상
      },
    });
  });

  // 시간 범위 변경 핸들러
  const handleTimeRangeChange = useCallback(() => {
    // 시간 범위는 useFilterStore에서 자동으로 업데이트됨
    mutate();
  }, [mutate]);

  // 필터 변경 핸들러
  const handleFilterChange = useCallback(() => {
    // 필터 변경 시 새 URL로 SWR이 자동으로 데이터를 다시 가져옵니다
    mutate();
  }, [mutate]);

  // 트레이스 클릭 핸들러
  const handleTraceClick = useCallback(
    (trace: TraceItem) => {
      router.push(`/traces/${trace.traceId}`);
    },
    [router]
  );

  // 새로고침 간격 변경 핸들러
  const handleRefreshIntervalChange = useCallback((interval: number) => {
    setRefreshInterval(interval);
  }, []);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <h1 className="text-xl font-bold">트레이스 모니터링 대시보드</h1>
        <p className="text-gray-500 text-sm mt-1">실시간 지연 시간 및 오류 모니터링</p>
      </div>

      <ThemeSwitch className="absolute top-4 right-4" />

      <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-7xl">
        <DateRangePicker onChange={handleTimeRangeChange} />
      </div>

      <div className="w-full max-w-7xl">
        <TraceVisualization
          traceData={data?.traces ?? []}
          onDataPointClick={handleTraceClick}
          title={error ? '데이터 로드 중 오류 발생' : undefined}
          showFilters={true}
          onFilterChange={handleFilterChange}
        />
      </div>
    </section>
  );
}
