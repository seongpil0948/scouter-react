'use client';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';

import { useFilterStore } from '@/lib/store/telemetryStore';
import { useTraceFilterStore } from '@/lib/store/traceFilterStore';
import DateRangePicker from '@/components/shared/DateRangePicker';
import { ThemeSwitch } from '@/components/shared/theme-switch';
import TraceVisualization from '@/components/traces/TraceVisualization';
import TraceFilter from '@/components/traces/TraceFilter';
import { useChartStore } from '@/lib/store/chartStore';
import { buildTraceApiUrl } from '@/lib/utils/filterUtils';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { BarChart2, List, ArrowRight } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const router = useRouter();
  const { timeRange } = useFilterStore();
  const { dataFilters, updateConfig } = useChartStore();

  // TraceFilterStore 상태 활용
  const { searchQuery, limit, selectedServices, selectedStatuses, minDuration, maxDuration, sortField, sortDirection, lastRefreshed } =
    useTraceFilterStore();

  const [chartConfig] = useState<ChartConfig>({
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
    brush: {
      enabled: true,
      type: 'rect',
      mode: 'multiple',
    },
  });

  // API URL 생성 - TraceFilterStore의 필터 상태 및 rootSpansOnly=true 추가
  const apiUrl = buildTraceApiUrl(
    '/api/telemetry/traces',
    {
      searchQuery,
      selectedServices,
      selectedStatuses,
      minDuration,
      maxDuration,
    },
    timeRange,
    limit,
    sortField,
    sortDirection,
    0, // 대시보드에서는 페이지네이션이 필요 없어 offset을 0으로 설정
    { rootSpansOnly: true } // 루트 스팬만 조회
  );

  // 트레이스 데이터 가져오기 (필터 반영된 URL 사용)
  const { data, error, mutate } = useSWR<TracesResponse>(
    [apiUrl, lastRefreshed], // lastRefreshed를 의존성에 추가하여 필터 변경 시 재요청
    () => fetcher(apiUrl),
    {
      refreshInterval: 0, // 자동 갱신 비활성화 (필터 변경 시만 갱신)
      revalidateOnFocus: false,
      dedupingInterval: 1000,
    }
  );

  // 트레이스 상세 보기 핸들러
  const handleTraceSelect = useCallback(
    (traceId: string) => {
      router.push(`/traces/${traceId}`);
    },
    [router]
  );

  const handleTimeRangeChange = useCallback(() => {
    mutate();
  }, [mutate]);

  // 필터 변경 핸들러
  const handleFilterChange = useCallback(() => {
    // 필터 변경 시 데이터 재요청
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
        {/* 헤더 영역 */}
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

        {/* TraceFilter 컴포넌트 추가 - /traces 페이지와 동일한 컴포넌트 사용 */}
        <TraceFilter onFilterChange={handleFilterChange} />

        {/* 차트 시각화 */}
        <TraceVisualization
          config={{
            ...chartConfig,
            title: error ? '데이터 로드 중 오류 발생' : chartConfig.title,
          }}
          traceData={data?.traces ?? []}
          onTraceSelect={handleTraceSelect}
          showFilters={false} /* 이미 TraceFilter 컴포넌트가 있으므로 내부 필터는 비활성화 */
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

      {/* 데이터 요약 표시 */}
      {data && (
        <div className="w-full max-w-7xl">
          <Card>
            <CardBody className="p-4">
              <div className="text-sm text-gray-500 text-right">
                총 {data.total}개의 트레이스 중 {data.traces.length}개 표시 중
                {data.rootSpansOnly && <span className="ml-2">(루트 스팬만 표시)</span>}
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </section>
  );
}
