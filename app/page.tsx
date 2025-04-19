'use client';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';

import { useFilterStore } from '@/lib/store/telemetryStore';
import { useChartStore } from '@/lib/store/chartStore';
import { useTraceData, RefreshIntervalOption, RealtimeRangeOption } from '@/lib/hooks/useTraceData';

import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { List, ArrowRight, Clock } from 'lucide-react';
import { ThemeSwitch } from '@/components/shared/theme-switch';
import { Skeleton } from '@heroui/skeleton';

// 클라이언트 사이드에서만 로드하도록 dynamic import
const TraceFilter = dynamic(() => import('@/components/traces/TraceFilter'), {
  ssr: false,
  loading: () => (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <Skeleton className="h-10 w-40 mb-2" />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  ),
});

// 클라이언트 사이드에서만 로드하도록 dynamic import
const TraceVisualization = dynamic(() => import('@/components/traces/TraceVisualization'), {
  ssr: false,
  loading: () => (
    <Card className="w-full">
      <CardBody className="p-4">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-[500px] w-full rounded-sm" />
      </CardBody>
    </Card>
  ),
});

// SSR에서 사용 가능한 단순 DateRangePicker
const DateRangePicker = dynamic(() => import('@/components/shared/DateRangePicker'), {
  ssr: true,
  loading: () => <Skeleton className="h-10 w-80" />,
});

export default function Home() {
  const router = useRouter();
  const { timeRange } = useFilterStore();
  const { updateConfig } = useChartStore();

  // 개선된 useTraceData 훅 사용
  const {
    traces,
    error,
    refresh,
    isLoading,
    isRealtime,
    toggleRealtime,
    refreshInterval,
    setRefreshInterval,
    realtimeRange,
    setRealtimeRange,
  } = useTraceData({
    refreshInterval: 5, // 기본 5초 갱신
    realtimeRange: 5, // 기본 5분 범위
    rootSpansOnly: true,
  });

  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    height: 500,
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
    // 실시간 모드 관련 추가 설정
    autoUpdate: false, // 초기값은 비활성화
  });

  // 실시간 모드 상태 변경 시 chartConfig 업데이트
  useEffect(() => {
    if (isRealtime !== chartConfig.autoUpdate) {
      setChartConfig((prev) => ({
        ...prev,
        autoUpdate: isRealtime,
        realtimeRange: realtimeRange,
      }));
    }
  }, [isRealtime, chartConfig.autoUpdate, realtimeRange]);

  // 트레이스 상세 보기 핸들러
  const handleTraceSelect = useCallback(
    (traceId: string) => {
      router.push(`/traces/${traceId}`);
    },
    [router]
  );

  // 시간 범위 변경 처리
  const handleTimeRangeChange = useCallback(() => {
    // 시간 범위가 변경되면 실시간 데이터 조회 비활성화
    if (isRealtime) {
      toggleRealtime(false);
    }
    refresh();
  }, [refresh, isRealtime, toggleRealtime]);

  // 디바운스를 위한 상태
  const [isChangingFilter, setIsChangingFilter] = useState(false);

  // 필터 변경 핸들러 - 디바운스 추가
  const handleFilterChange = useCallback(() => {
    if (isChangingFilter) return;

    setIsChangingFilter(true);
    setTimeout(() => {
      refresh();
      setIsChangingFilter(false);
    }, 300);
  }, [refresh, isChangingFilter]);

  // 실시간 갱신 간격 변경 - 디바운스 추가
  const handleRefreshIntervalChange = useCallback(
    (interval: RefreshIntervalOption) => {
      if (interval === refreshInterval) return; // 같은 값이면 변경하지 않음
      setRefreshInterval(interval);
    },
    [setRefreshInterval, refreshInterval]
  );

  // 실시간 조회 범위 변경 - 디바운스 추가 및 chartConfig 동기화
  const handleRealtimeRangeChange = useCallback(
    (range: RealtimeRangeOption) => {
      if (range === realtimeRange) return; // 같은 값이면 변경하지 않음
      setRealtimeRange(range);

      // Chart 설정도 함께 업데이트
      setChartConfig((prev) => ({
        ...prev,
        realtimeRange: range,
      }));
    },
    [setRealtimeRange, realtimeRange]
  );

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
      <div className="w-full flex justify-between items-center bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <h2 className="text-xl font-semibold">IDS APM</h2>
        <div className="flex items-center gap-4">
          <DateRangePicker onChange={handleTimeRangeChange} isRealtime={isRealtime} />
        </div>
        <Button color="primary" endContent={<ArrowRight size={16} />} onPress={navigateToTraces}>
          <List size={16} className="mr-1" />
          트레이스 목록 보기
        </Button>
        <ThemeSwitch className="absolute top-4 right-4" />
      </div>
      <div className="w-full max-w-7xl space-y-4">
        <TraceFilter
          onFilterChange={handleFilterChange}
          isRealtime={isRealtime}
          onToggleRealtime={toggleRealtime}
          refreshInterval={refreshInterval}
          onRefreshIntervalChange={handleRefreshIntervalChange}
          realtimeRange={realtimeRange}
          onRealtimeRangeChange={handleRealtimeRangeChange}
          onRefresh={refresh} // 통합된 새로고침 함수 전달
        />
        <TraceVisualization
          config={{
            ...chartConfig,
            title: error ? '데이터 로드 중 오류 발생' : isRealtime ? `실시간 요청 지연 시간 (${realtimeRange}분)` : chartConfig.title,
            // 실시간 모드일 때 자동 업데이트를 활성화
            autoUpdate: isRealtime,
          }}
          traceData={traces}
          onTraceSelect={handleTraceSelect}
          showFilters={false} /* 이미 TraceFilter 컴포넌트가 있으므로 내부 필터는 비활성화 */
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* 로딩 상태 표시 */}
      {isLoading && traces.length === 0 && (
        <Card className="w-full max-w-7xl">
          <CardBody className="p-8 flex justify-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              <p className="mt-4 text-gray-500">데이터를 불러오는 중...</p>
            </div>
          </CardBody>
        </Card>
      )}

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
      {traces.length > 0 && (
        <div className="w-full max-w-7xl">
          <Card>
            <CardBody className="p-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {isRealtime ? (
                    <span className="flex items-center">
                      <Clock size={14} className="mr-1 text-blue-500" />
                      <span>
                        실시간 데이터 {refreshInterval}초마다 자동 갱신 중 (최근 {realtimeRange}분 데이터)
                      </span>
                    </span>
                  ) : (
                    <span>선택된 기간에 대한 데이터</span>
                  )}
                </div>
                <div className="text-sm text-gray-500">총 {traces.length}개 트레이스 표시 중 (루트 스팬만 표시)</div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </section>
  );
}
