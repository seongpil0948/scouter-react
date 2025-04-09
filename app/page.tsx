'use client';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';

import { useFilterStore } from '@/lib/store/telemetryStore';
import DateRangePicker from '@/components/shared/DateRangePicker';
import { ThemeSwitch } from '@/components/shared/theme-switch';
import TraceVisualization from '@/components/traces/TraceVisualization';
import { useChartStore } from '@/lib/store/chartStore';
import { buildApiUrlWithFilters } from '@/lib/utils/filterUtils';
import TraceFilter from '@/components/traces/TraceFilter';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { BarChart2, List, ArrowRight } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const router = useRouter();
  const { timeRange } = useFilterStore();
  const { dataFilters, updateConfig } = useChartStore();
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

  // API URL 생성 - 필터 상태 반영
  const apiUrl = buildApiUrlWithFilters('/api/telemetry/traces', dataFilters, timeRange);

  // 트레이스 데이터 가져오기 (필터 반영된 URL 사용)
  const { data, error, mutate } = useSWR<DtoTrace>(apiUrl, fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
    dedupingInterval: 1000,
  });

  const handleTraceClick = useCallback(
    (trace: TraceItem) => {
      router.push(`/traces/${trace.traceId}`);
    },
    [router]
  );

  const handleTimeRangeChange = useCallback(() => {
    mutate();
  }, [mutate]);

  // 필터 변경 핸들러
  const handleFilterChange = useCallback(() => {
    // 필터 변경 시 새 URL로 SWR이 자동으로 데이터를 다시 가져옵니다
    mutate();
  }, [mutate]);

  // 트레이스 목록 페이지로 이동
  const navigateToTraces = useCallback(() => {
    router.push('/traces');
  }, [router]);

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

      <div className="w-full max-w-7xl space-y-4">
        {/* 간단한 필터 컨트롤 (대시보드에서는 제한된 기능) */}
        <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <BarChart2 size={20} className="mr-2 text-blue-500" />
            <h2 className="text-lg font-medium">트레이스 시각화</h2>
          </div>

          <Button color="primary" endContent={<ArrowRight size={16} />} onPress={navigateToTraces}>
            <List size={16} className="mr-1" />
            트레이스 목록 보기
          </Button>
        </div>

        {/* 차트 시각화 (기존 TraceVisualization 유지) */}
        <TraceVisualization
          config={{
            ...chartConfig,
            title: error ? '데이터 로드 중 오류 발생' : chartConfig.title,
          }}
          traceData={data?.traces ?? []}
          onDataPointClick={handleTraceClick}
          showFilters={true}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* 에러 표시 */}
      {error && (
        <Card className="w-full max-w-7xl mt-4">
          <CardBody className="p-4">
            <div className="text-center text-red-500">
              <p>데이터를 불러오는 중 오류가 발생했습니다:</p>
              <p className="text-sm mt-2">{error.message}</p>
            </div>
          </CardBody>
        </Card>
      )}
    </section>
  );
}
