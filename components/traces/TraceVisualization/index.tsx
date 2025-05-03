"use client";

import React, { useMemo, useCallback, useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";
import { useIsSSR } from "@react-aria/ssr";
import { useDisclosure } from "@heroui/modal";
import { BarChart2, LineChart } from "lucide-react";

import TraceChart from "./TraceChart";
import TraceAnalytics from "./TraceAnalytics";
import SelectedTracesModal from "./SelectedTracesModal";
import StatsSummary from "./StatsSummary";
import FilterControls from "./FilterControls";
import ThresholdDisplay from "./ThresholdDisplay";
import NoData from "./NoData";
import FilterSummary from "./FilterSummary";

import { useChartStore } from "@/lib/store/chartStore";
import { useFilterStore } from "@/lib/store/telemetryStore";
import {
  buildServiceThresholds,
  calculateServiceStats,
  calculateLatencyStats,
  processTraceData,
} from "./utils";
import { DEFAULT_FILTER } from "./constant";

const TraceVisualization: React.FC<TraceVisualizationProps> = ({
  traceData,
  config = {},
  title,
  showFilters = false,
  serviceThresholds: propServiceThresholds,
  onFilterChange,
  onTraceSelect,
}) => {
  // Check SSR environment
  const isSSR = useIsSSR();

  // Local state
  const [activeTab, setActiveTab] = useState<string>("chart");
  const [selectedTraces, setSelectedTraces] = useState<SelectedTraceData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get state from stores
  const { legendState, dataFilters, updateDataFilters } = useChartStore();
  const { isRealtime } = useFilterStore();

  // Modal for selected traces
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  // Safely handle trace data in SSR environment
  const safeTraceData = useMemo(() => {
    return isSSR ? [] : Array.isArray(traceData) ? traceData : [];
  }, [traceData, isSSR]);

  // Build service thresholds
  const serviceThresholds = useMemo(
    () => buildServiceThresholds(safeTraceData, propServiceThresholds),
    [safeTraceData, propServiceThresholds]
  );

  const filteredData = safeTraceData;

  // Get unique services
  const services = useMemo(() => {
    if (isSSR) return [];

    const serviceSet = new Set<string>();
    safeTraceData.forEach((trace) => {
      if (trace.serviceName) {
        serviceSet.add(trace.serviceName);
      }
    });
    return Array.from(serviceSet).sort();
  }, [safeTraceData, isSSR]);

  // Calculate service statistics
  const serviceStats = useMemo(
    () =>
      isSSR
        ? new Map()
        : calculateServiceStats(filteredData, serviceThresholds),
    [filteredData, serviceThresholds, isSSR]
  );

  // Calculate latency statistics
  const latencyStats = useMemo(
    () =>
      isSSR
        ? { min: 0, max: 0, avg: 0, p90: 0, p95: 0, p99: 0 }
        : calculateLatencyStats(filteredData),
    [filteredData, isSSR]
  );

  // Process chart data
  const chartData = useMemo(() => {
    // Skip in SSR or while already processing
    if (isSSR || isProcessing) {
      return {
        timeSeriesData: [],
        highLatencyData: [],
        metadataMap: new Map(),
      };
    }

    try {
      setIsProcessing(true);
      const result = processTraceData(
        filteredData,
        config.latencyThreshold,
        serviceThresholds
      );
      return result;
    } catch (error) {
      console.error("[TraceVisualization] Error processing trace data:", error);
      return {
        timeSeriesData: [],
        highLatencyData: [],
        metadataMap: new Map(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, [
    filteredData,
    config.latencyThreshold,
    serviceThresholds,
    isSSR,
    isProcessing,
  ]);

  // Handle brush selection
  const handleBrushSelected = useCallback(
    (selectedData: SelectedTraceData[]) => {
      if (isSSR) return;

      // Update selected traces and open modal
      if (selectedData.length > 0) {
        setSelectedTraces(selectedData);
        onOpen();
      }
    },
    [isSSR, onOpen]
  );

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedTraces([]);
  }, []);

  // View trace details
  const handleViewTraceDetails = useCallback(
    (traceId: string) => {
      if (onTraceSelect) {
        onTraceSelect(traceId);
        onClose();
      }
    },
    [onTraceSelect, onClose]
  );

  // Handle chart data point click
  const handleDataPointClick = useCallback(
    (timestamp: number) => {
      // Find closest trace to the clicked timestamp
      const closestTrace = filteredData.reduce(
        (closest, trace) => {
          const currentDiff = Math.abs(trace.startTime - timestamp);
          const closestDiff = closest
            ? Math.abs(closest.startTime - timestamp)
            : Infinity;

          return currentDiff < closestDiff ? trace : closest;
        },
        null as TraceItem | null
      );

      if (closestTrace && onTraceSelect) {
        onTraceSelect(closestTrace.traceId);
      }
    },
    [filteredData, onTraceSelect]
  );

  // Calculate metrics
  const errorCount = filteredData.filter((t) => t.status === "ERROR").length;
  const successCount = filteredData.filter((t) => t.status === "OK").length;
  const highLatencyCount = chartData.highLatencyData.length;
  const hasFilters =
    dataFilters.serviceFilter !== "all" ||
    dataFilters.statusFilter !== "all" ||
    dataFilters.minDuration !== undefined ||
    dataFilters.maxDuration !== undefined;

  // Get realtime status from config
  const isRealtimeMode = useMemo(
    () => config.autoUpdate === true,
    [config.autoUpdate]
  );

  return (
    <div className="space-y-4">
      <Card className="w-full">
        {/* Filter controls */}
        {showFilters && (
          <FilterControls
            services={services}
            dataFilters={dataFilters}
            updateDataFilters={updateDataFilters}
            onFilterChange={onFilterChange}
            hasFilters={hasFilters}
          />
        )}

        {/* Visualization tabs */}
        <Tabs
          aria-label="트레이스 시각화 모드"
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
          className="px-4 pt-2"
        >
          <Tab
            key="chart"
            title={
              <div className="flex items-center">
                <LineChart size={16} className="mr-1" />
                차트 보기
              </div>
            }
          />
          <Tab
            key="analytics"
            title={
              <div className="flex items-center">
                <BarChart2 size={16} className="mr-1" />
                분석 보기
                {filteredData?.length}
              </div>
            }
          />
        </Tabs>

        <CardBody className="p-4">
          {activeTab === "chart" && (
            <>
              {/* Statistics summary */}
              {filteredData.length > 0 && (
                <StatsSummary
                  latencyStats={latencyStats}
                  highLatencyCount={highLatencyCount}
                  successCount={successCount}
                  errorCount={errorCount}
                  selectedTracesCount={selectedTraces.length}
                  onClearSelection={handleClearSelection}
                />
              )}

              {/* Service thresholds */}
              {showFilters && filteredData.length > 0 && (
                <ThresholdDisplay
                  serviceThresholds={serviceThresholds}
                  serviceStats={serviceStats}
                />
              )}

              {filteredData.length > 0 ? (
                <TraceChart
                  data={chartData}
                  height={config.height}
                  config={{
                    ...config,
                    brush: {
                      enabled: true,
                      type: "rect",
                      mode: "multiple",
                      throttleType: "debounce",
                      throttleDelay: 300,
                      ...config.brush,
                    },
                    realtimeRange: config.realtimeRange || 5,
                  }}
                  onBrushSelected={handleBrushSelected}
                  onDataPointClick={handleDataPointClick}
                  legendState={legendState}
                  serviceThresholds={serviceThresholds}
                />
              ) : (
                <NoData
                  isRealtime={isRealtimeMode || isRealtime}
                  hasFilters={hasFilters}
                />
              )}

              {filteredData.length > 0 && (
                <FilterSummary
                  filteredDataLength={filteredData.length}
                  dataFilters={dataFilters}
                  hasFilters={hasFilters}
                  onResetFilters={() => updateDataFilters(DEFAULT_FILTER)}
                />
              )}
            </>
          )}

          {/* Analytics tab */}
          {activeTab === "analytics" && (
            <TraceAnalytics
              traces={filteredData}
              onTraceSelect={onTraceSelect}
            />
          )}
        </CardBody>
      </Card>

      {/* Selected traces modal */}
      <SelectedTracesModal
        selectedTraces={selectedTraces}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onClearSelection={handleClearSelection}
        onViewDetails={handleViewTraceDetails}
      />
    </div>
  );
};

TraceVisualization.displayName = "TraceVisualization";

export default React.memo(TraceVisualization);
