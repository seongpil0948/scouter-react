"use client";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { Activity, AlertTriangle, Clock, Info } from "lucide-react";
import { Card, CardBody } from "@heroui/card";

import {
  useTelemetryStore,
  useFilterStore,
  TraceItem,
  ServiceMetric,
} from "@/lib/store/telemetryStore";
import Header from "@/components/layout/Header";
import TraceVisualization from "@/components/traces/TraceVisualization";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const router = useRouter();
  const { timeRange } = useFilterStore();
  const { setTraces, traces } = useTelemetryStore();
  const [errorCount, setErrorCount] = useState(0);
  const [avgLatency, setAvgLatency] = useState(0);
  const [serviceCount, setServiceCount] = useState(0);
  const [topServices, setTopServices] = useState<ServiceMetric[]>([]);

  // 메트릭 데이터 가져오기
  const {
    data: metricsData,
    error: metricsError,
    isLoading: isLoadingMetrics,
  } = useSWR(
    `/api/telemetry/metrics?startTime=${timeRange.startTime}&endTime=${timeRange.endTime}`,
    fetcher,
    { refreshInterval: 30000 }, // 30초마다 자동 갱신
  );

  // 데이터 처리
  useEffect(() => {
    if (metricsData) {
      setTraces(metricsData.recentTraces || []);
      setErrorCount(metricsData.summary?.totalErrors || 0);
      setAvgLatency(metricsData.summary?.averageLatency || 0);
      setServiceCount(metricsData.summary?.serviceCount || 0);
      setTopServices(metricsData.topLatencyServices || []);
    }
  }, [metricsData, setTraces]);

  // 트레이스 상세 보기로 이동
  const handleTraceClick = (trace: TraceItem) => {
    router.push(`/traces/${trace.traceId}`);
  };

  // 지연 시간 포맷팅
  const formatDuration = (duration: number) => {
    if (duration < 1) return "<1ms";
    if (duration < 1000) return `${duration.toFixed(2)}ms`;

    return `${(duration / 1000).toFixed(2)}s`;
  };

  // 트레이스 시각화 설정
  const traceVisualizationConfig = {
    height: 400,
    title: "실시간 요청 지연 시간",
    latencyThreshold: 300,
    maxDataPoints: 100,
    autoUpdate: false,
    colors: {
      low: "#52c41a",      // 낮은 지연시간
      medium: "#1890ff",   // 보통 지연시간
      high: "#faad14",     // 높은 지연시간
      critical: "#ff4d4f", // 임계치 초과 지연시간
      effectScatter: "#ff4d4f", // 고지연 요청 색상
    },
  };

  return (
    <>
      <Header title="애플리케이션 성능 모니터링 대시보드" />

      <div className="mt-4">
        {/* 요약 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <h2 className="flex flex-row items-center justify-between pb-2">
              <div className="text-sm font-medium">모니터링 중인 서비스</div>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </h2>
            <CardBody>
              <div className="text-2xl font-bold">{serviceCount}</div>
            </CardBody>
          </Card>

          <Card>
            <h2 className="flex flex-row items-center justify-between pb-2">
              <div className="text-sm font-medium">평균 응답 시간</div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </h2>
            <CardBody>
              <div className="text-2xl font-bold">
                {formatDuration(avgLatency)}
              </div>
            </CardBody>
          </Card>

          <Card>
            <h2 className="flex flex-row items-center justify-between pb-2">
              <div className="text-sm font-medium">오류 발생 수</div>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </h2>
            <CardBody>
              <div className="text-2xl font-bold">{errorCount}</div>
            </CardBody>
          </Card>

          <Card>
            <h2 className="flex flex-row items-center justify-between pb-2">
              <div className="text-sm font-medium">모니터링 기간</div>
              <Info className="h-4 w-4 text-muted-foreground" />
            </h2>
            <CardBody>
              <div className="text-2xl font-bold">
                {new Date(timeRange.endTime - timeRange.startTime)
                  .toISOString()
                  .substring(11, 8)}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* 지연 시간 시각화 */}
        <div className="mb-6">
          <div className="text-xl font-bold mb-4">실시간 지연 시간 모니터링</div>
          <TraceVisualization
            traceData={traces}
            onDataPointClick={handleTraceClick}
            config={traceVisualizationConfig}
          />
        </div>

        {/* 서비스 성능 표 */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">상위 지연 시간 서비스</h2>
          <Card>
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        서비스
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        요청 수
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        평균 응답 시간
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        오류율
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        p95 응답 시간
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topServices.map((service) => (
                      <tr key={service.name} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {service.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {service.requestCount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDuration(service.avgLatency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              service.errorRate > 5
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {service.errorRate.toFixed(2)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDuration(service.p95Latency)}
                        </td>
                      </tr>
                    ))}

                    {topServices.length === 0 && (
                      <tr>
                        <td
                          className="px-6 py-4 text-center text-gray-500"
                          colSpan={5}
                        >
                          {isLoadingMetrics
                            ? "데이터를 불러오는 중..."
                            : "서비스 데이터가 없습니다."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}