'use client';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';

import { useFilterStore } from '@/lib/store/telemetryStore';
import { useChartStore } from '@/lib/store/chartStore';
import { useTraceData } from '@/lib/hooks/useTraceData'; // 새로운 커스텀 훅 사용

import TraceVisualization from '@/components/traces/TraceVisualization';
import TraceFilter from '@/components/traces/TraceFilter';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { List, ArrowRight, RefreshCw, Clock } from 'lucide-react';
import DateRangePicker from '@/components/shared/DateRangePicker';
import { ThemeSwitch } from '@/components/shared/theme-switch';

export default function Home() {
  const router = useRouter();
  const { timeRange } = useFilterStore();
  const { updateConfig } = useChartStore();

  // useTraceData 커스텀 훅 사용
  const { traces, error, refresh, isLoading, isRealtime, toggleRealtime } = useTraceData({
    refreshInterval: 5000,
    rootSpansOnly: true,
  });

  const [chartConfig] = useState<ChartConfig>({
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
  });

  // 트레이스 상세 보기 핸들러
  const handleTraceSelect = useCallback(
    (traceId: string) => {
      router.push(`/traces/${traceId}`);
    },
    [router]
  );

  const handleTimeRangeChange = useCallback(() => {
    // 시간 범위가 변경되면 실시간 데이터 조회 비활성화
    if (isRealtime) {
      toggleRealtime(false);
    }
    refresh();
  }, [refresh, isRealtime, toggleRealtime]);

  // 필터 변경 핸들러
  const handleFilterChange = useCallback(() => {
    refresh();
  }, [refresh]);

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
      <div className="w-full flex justify-between items-center bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold">IDS APM</h2>
        <div className="flex items-center gap-4">
          <DateRangePicker onChange={handleTimeRangeChange} isRealtime={isRealtime} />
          <Button
            color="default"
            size="sm"
            onPress={refresh}
            title="새로고침"
            isDisabled={isRealtime} // 실시간 모드일 때는 비활성화
          >
            <RefreshCw size={16} />
          </Button>
        </div>
        <Button color="primary" endContent={<ArrowRight size={16} />} onPress={navigateToTraces}>
          <List size={16} className="mr-1" />
          트레이스 목록 보기
        </Button>
        <ThemeSwitch className="absolute top-4 right-4" />
      </div>
      <div className="w-full max-w-7xl space-y-4">
        <TraceFilter onFilterChange={handleFilterChange} isRealtime={isRealtime} onToggleRealtime={toggleRealtime} />
        <TraceVisualization
          config={{
            ...chartConfig,
            title: error ? '데이터 로드 중 오류 발생' : isRealtime ? '실시간 요청 지연 시간 (5분)' : chartConfig.title,
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
                      <span>실시간 데이터 5초마다 자동 갱신 중</span>
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
