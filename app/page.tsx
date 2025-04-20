// app/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Drawer,
  DrawerContent,
  DrawerBody,
  DrawerHeader,
} from "@heroui/drawer";
import { X, List, ArrowRight, Clock, BarChart2 } from "lucide-react";

import { useFilterStore } from "@/lib/store/telemetryStore";
import { useChartStore } from "@/lib/store/chartStore";
import { useTraceData } from "@/lib/hooks/useTraceData";

import { Card, CardBody } from "@heroui/card";
import { ThemeSwitch } from "@/components/shared/theme-switch";
import { Skeleton } from "@heroui/skeleton";
import TraceDetail from "@/components/traces/TraceDetail";
import { Button } from "@heroui/button";
import { useDisclosure } from "@heroui/modal";
import { Tabs, Tab } from "@heroui/tabs";
import { siteConfig } from "@/config/site";

// 클라이언트 사이드에서만 로드하도록 dynamic import
const TraceFilter = dynamic(() => import("@/components/traces/TraceFilter"), {
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
const TraceVisualization = dynamic(
  () => import("@/components/traces/TraceVisualization"),
  {
    ssr: false,
    loading: () => (
      <Card className="w-full">
        <CardBody className="p-4">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-[500px] w-full rounded-sm" />
        </CardBody>
      </Card>
    ),
  }
);

// 트레이스 분석 컴포넌트도 dynamic import
const TraceAnalytics = dynamic(
  () => import("@/components/traces/TraceVisualization/TraceAnalytics"),
  {
    ssr: false,
    loading: () => (
      <Card className="w-full">
        <CardBody className="p-4">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-[400px] w-full rounded-sm" />
        </CardBody>
      </Card>
    ),
  }
);

const DateRangePicker = dynamic(
  () => import("@/components/shared/DateRangePicker"),
  {
    ssr: true,
    loading: () => <Skeleton className="h-10 w-80" />,
  }
);

export default function Home() {
  const router = useRouter();
  const { isRealtime } = useFilterStore();
  const { updateConfig } = useChartStore();

  // 활성 탭 상태 관리
  const [activeTab, setActiveTab] = useState<string>("visualization");

  // 선택된 트레이스 ID 상태 관리
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // useTraceData 훅 사용 - 실시간 관련 props 전달 제거
  const { traces, error, refresh, isLoading } = useTraceData({
    rootSpansOnly: true,
  });

  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    height: 500,
    title: "실시간 요청 지연 시간",
    latencyThreshold: 300,
    colors: {
      low: "#52c41a",
      medium: "#1890ff",
      high: "#faad14",
      critical: "#ff4d4f",
      error: "#ff4d4f",
    },
    brush: {
      enabled: true,
      type: "rect",
      mode: "multiple",
    },
    autoUpdate: false,
  });

  // 실시간 모드 상태 변경 시 chartConfig 업데이트
  useEffect(() => {
    if (isRealtime !== chartConfig.autoUpdate) {
      setChartConfig((prev) => ({
        ...prev,
        autoUpdate: isRealtime,
      }));
    }
  }, [isRealtime, chartConfig.autoUpdate]);

  // 트레이스 상세 보기 핸들러
  const handleTraceSelect = useCallback(
    (traceId: string) => {
      setSelectedTraceId(traceId);
      onOpen(); // Drawer 열기
    },
    [onOpen]
  );

  // 시간 범위 변경 처리
  const handleTimeRangeChange = useCallback(
    (startTime: number, endTime: number) => {
      // 시간 범위가 변경되면 데이터 새로고침
      setTimeout(() => {
        refresh();
      }, 200);
    },
    [refresh]
  );

  // 필터 변경 핸들러
  const handleFilterChange = useCallback(() => {
    setTimeout(() => {
      refresh();
    }, 300);
  }, [refresh]);

  // 트레이스 목록 페이지로 이동
  const navigateToTraces = useCallback(() => {
    router.push("/traces");
  }, [router]);

  // 컴포넌트 마운트 시 차트 설정 초기화
  useEffect(() => {
    updateConfig(chartConfig);
  }, [chartConfig, updateConfig]);

  return (
    <section className="flex flex-col items-center justify-center gap-4 pb-4 md:pb-5">
      <div className="w-full flex justify-between items-center bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <h2 className="text-xl font-semibold">{siteConfig.name}</h2>
        <div className="flex items-center gap-4">
          <DateRangePicker onChange={handleTimeRangeChange} />
        </div>
        <Button
          color="primary"
          endContent={<ArrowRight size={16} />}
          onPress={navigateToTraces}
        >
          <List size={16} className="mr-1" />
          목록 보기
        </Button>
        <ThemeSwitch className="absolute top-4 right-4" />
      </div>

      <div className="w-full max-w-7xl space-y-4">
        {/* TraceFilter에 불필요한 props 제거 */}
        <TraceFilter onFilterChange={handleFilterChange} onRefresh={refresh} />

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
            {activeTab === "visualization" && (
              <TraceVisualization
                config={{
                  ...chartConfig,
                  title: error
                    ? "데이터 로드 중 오류 발생"
                    : isRealtime
                      ? `실시간 요청 지연 시간`
                      : chartConfig.title,
                  autoUpdate: isRealtime,
                }}
                traceData={traces}
                onTraceSelect={handleTraceSelect}
                showFilters={false}
                onFilterChange={handleFilterChange}
              />
            )}

            {activeTab === "analytics" && (
              <TraceAnalytics
                traces={traces}
                onTraceSelect={handleTraceSelect}
              />
            )}
          </CardBody>
        </Card>
      </div>

      {/* 드로어 부분 - 변경 없음 */}
      <Drawer
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="xl"
        placement="right"
        classNames={{
          base: "max-w-[90%] sm:max-w-[800px]",
          body: "p-0",
        }}
      >
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="flex justify-between items-center border-b p-4">
                <div className="flex items-center gap-2">
                  <Button
                    title="닫기"
                    variant="light"
                    isIconOnly
                    onPress={onClose}
                  >
                    <X size={18} />
                  </Button>
                  <h2 className="text-xl">트레이스 상세</h2>
                </div>
              </DrawerHeader>
              <DrawerBody>
                {selectedTraceId && (
                  <TraceDetail traceId={selectedTraceId} onBack={onClose} />
                )}
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </section>
  );
}
