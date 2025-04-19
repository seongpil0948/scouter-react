'use client';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Drawer,
  DrawerContent,
  DrawerBody,
  DrawerHeader,
} from "@heroui/drawer";
import { X, List, ArrowRight, Clock, BarChart2 } from 'lucide-react';

import { useFilterStore } from '@/lib/store/telemetryStore';
import { useChartStore } from '@/lib/store/chartStore';
import { useTraceData, RefreshIntervalOption, RealtimeRangeOption } from '@/lib/hooks/useTraceData';

import { Card, CardBody } from '@heroui/card';
import { ThemeSwitch } from '@/components/shared/theme-switch';
import { Skeleton } from '@heroui/skeleton';
import TraceDetail from '@/components/traces/TraceDetail';
import { Button } from '@heroui/button';
import { useDisclosure } from '@heroui/modal';
import { Tabs, Tab } from '@heroui/tabs';

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

// 트레이스 분석 컴포넌트도 dynamic import
const TraceAnalytics = dynamic(() => import('@/components/traces/TraceVisualization/TraceAnalytics'), {
  ssr: false,
  loading: () => (
    <Card className="w-full">
      <CardBody className="p-4">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-[400px] w-full rounded-sm" />
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
  
  // 활성 탭 상태 관리
  const [activeTab, setActiveTab] = useState<string>('visualization');
  
  // 선택된 트레이스 ID 상태 관리
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

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
  const handleTraceSelect = useCallback((traceId: string) => {
    setSelectedTraceId(traceId);
    onOpen(); // Drawer 열기
  }, [onOpen]);

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

  // 실시간 갱신 간격 변경
  const handleRefreshIntervalChange = useCallback(
    (interval: RefreshIntervalOption) => {
      if (interval === refreshInterval) return; // 같은 값이면 변경하지 않음
      setRefreshInterval(interval);
    },
    [setRefreshInterval, refreshInterval]
  );

  // 실시간 조회 범위 변경
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
    <section className="flex flex-col items-center justify-center gap-4 pb-4 md:pb-5">
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
          onRefresh={refresh}
        />
        
        <Card className="w-full">
          <Tabs 
            aria-label="데이터 시각화 모드" 
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            className="px-4 pt-2"
          >
            <Tab
              key="visualization"
              title={
                <div className="flex items-center">
                  <Clock size={16} className="mr-1" />
                  타임라인 시각화
                </div>
              }
            />
            <Tab
              key="analytics"
              title={
                <div className="flex items-center">
                  <BarChart2 size={16} className="mr-1" />
                  분석 요약
                </div>
              }
            />
          </Tabs>
          
          <CardBody className="p-4">
            {activeTab === 'visualization' && (
              <TraceVisualization
                config={{
                  ...chartConfig,
                  title: error ? '데이터 로드 중 오류 발생' : isRealtime ? `실시간 요청 지연 시간 (${realtimeRange}분)` : chartConfig.title,
                  autoUpdate: isRealtime,
                }}
                traceData={traces}
                onTraceSelect={handleTraceSelect}
                showFilters={false}
                onFilterChange={handleFilterChange}
              />
            )}
            
            {activeTab === 'analytics' && (
              <TraceAnalytics 
                traces={traces} 
                onTraceSelect={handleTraceSelect}
              />
            )}
          </CardBody>
        </Card>
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

      {/* 트레이스 상세 정보 Drawer */}
      <Drawer 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        size="xl"
        placement="right"
        classNames={{
          base: "max-w-[90%] sm:max-w-[800px]",
          body: "p-0"
        }}
      >
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="flex justify-between items-center border-b p-4">
                <div className="flex items-center gap-2">
                  <Button title="닫기" variant="light" isIconOnly onPress={onClose}>
                    <X size={18} />
                  </Button>
                  <h2 className="text-xl">트레이스 상세</h2>
                </div>
              </DrawerHeader>
              <DrawerBody>
                {selectedTraceId && (
                  <TraceDetail 
                    traceId={selectedTraceId} 
                    onBack={onClose}
                  />
                )}
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </section>
  );
}