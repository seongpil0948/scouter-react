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
import { X, List, ArrowRight, Clock, BarChart2, RefreshCw } from "lucide-react";

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

// Client-side only imports
const TraceFilter = dynamic(() => import("@/components/traces/TraceFilter"), {
  ssr: false,
  loading: () => (
    <div className="w-full   rounded-lg shadow-sm p-4">
      <Skeleton className="h-10 w-40 mb-2" />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  ),
});

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
    ssr: false,
    loading: () => <Skeleton className="h-10 w-80" />,
  }
);

export default function Home() {
  const router = useRouter();

  // Stores
  const { isRealtime, setTimeRange } = useFilterStore();
  const { updateConfig } = useChartStore();

  // Local state
  const [activeTab, setActiveTab] = useState<string>("visualization");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Drawer for trace details
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // Use enhanced trace data hook
  const {
    traces,
    error,
    isLoading,
    refresh,
    selectedTraceId,
    setSelectedTraceId,
  } = useTraceData({
    rootSpansOnly: true,
    autoRefresh: isRealtime,
  });

  // Chart configuration
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

  // Update chart config when realtime mode changes
  useEffect(() => {
    if (isRealtime !== chartConfig.autoUpdate) {
      setChartConfig((prev) => ({
        ...prev,
        autoUpdate: isRealtime,
      }));

      // Also update the chart store
      updateConfig({ autoUpdate: isRealtime });
    }
  }, [isRealtime, chartConfig.autoUpdate, updateConfig]);

  // Trace selection handler
  const handleTraceSelect = useCallback(
    (traceId: string) => {
      setSelectedTraceId(traceId);
      onOpen(); // Open drawer
    },
    [setSelectedTraceId, onOpen]
  );

  const handleTimeRangeChange = useCallback(
    (startTime: number, endTime: number) => {
      const changed = setTimeRange(startTime, endTime);
      if (changed) {
        setTimeout(() => {
          refresh();
        }, 100);
      }
    },
    [setTimeRange, refresh]
  );

  // Filter change handler
  const handleFilterChange = useCallback(() => {
    // Short delay to allow all filter changes to complete
    setTimeout(() => {
      refresh();
    }, 300);
  }, [refresh]);

  // Manual refresh handler with debounce
  const handleManualRefresh = useCallback(() => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    refresh().finally(() => {
      setTimeout(() => setIsRefreshing(false), 500);
    });
  }, [refresh, isRefreshing]);

  // Navigation to traces page
  const navigateToTraces = useCallback(() => {
    router.push("/traces");
  }, [router]);

  // Initialize chart config on mount
  useEffect(() => {
    updateConfig(chartConfig);
  }, [chartConfig, updateConfig]);

  return (
    <section className="flex flex-col items-center justify-center gap-4 pb-4 md:pb-5">
      <div className="w-full flex justify-between items-center  rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-4">
          <DateRangePicker
            onChange={handleTimeRangeChange}
            isDisabled={isRealtime}
          />

          <Button
            isIconOnly
            variant="light"
            onPress={handleManualRefresh}
            isDisabled={isRealtime || isLoading}
            isLoading={isRefreshing}
            title="데이터 새로고침"
          >
            <RefreshCw size={18} />
          </Button>
        </div>

        <Button
          color="primary"
          endContent={<ArrowRight size={16} />}
          onPress={navigateToTraces}
        >
          <List size={16} className="mr-1" />
          목록 보기
        </Button>

        <ThemeSwitch className="absolute top-6 right-4" />
      </div>

      <div className="w-full max-w-7xl space-y-4">
        {/* Filter component */}
        <TraceFilter
          onFilterChange={handleFilterChange}
          onRefresh={handleManualRefresh}
        />

        {/* Main content card */}
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
            {/* Show loading state */}
            {isLoading && traces?.length === 0 && (
              <div className="flex justify-center items-center h-[500px]">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
                  <p className="text-gray-500">데이터를 불러오는 중...</p>
                </div>
              </div>
            )}

            {/* Show error state */}
            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center h-[500px] text-center">
                <div className="text-red-500 mb-4">
                  데이터를 불러오는 중 오류가 발생했습니다
                </div>
                <div className="text-sm text-gray-500 mb-4">
                  {error.message}
                </div>
                <Button color="primary" onPress={handleManualRefresh}>
                  다시 시도
                </Button>
              </div>
            )}

            {/* Timeline visualization tab */}
            {activeTab === "visualization" && !error && (
              <TraceVisualization
                config={{
                  ...chartConfig,
                  title: isRealtime
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

            {/* Analytics tab */}
            {activeTab === "analytics" && !error && traces?.length > 0 && (
              <TraceAnalytics
                traces={traces}
                onTraceSelect={handleTraceSelect}
              />
            )}

            {/* Empty analytics state */}
            {activeTab === "analytics" &&
              !error &&
              traces?.length === 0 &&
              !isLoading && (
                <div className="flex justify-center items-center h-[300px] text-center">
                  <div className="text-gray-500">
                    <p className="mb-2">분석할 데이터가 없습니다</p>
                    <p className="text-sm">
                      시간 범위를 조정하거나 필터를 변경해보세요
                    </p>
                  </div>
                </div>
              )}
          </CardBody>
        </Card>
      </div>

      {/* Trace detail drawer */}
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
