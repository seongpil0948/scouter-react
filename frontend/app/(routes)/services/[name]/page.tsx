"use client";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardBody } from "@heroui/card";

import {
  useFilterStore,
  ServiceMetric,
  TraceItem,
  LogItem,
} from "@/lib/store/telemetryStore";
import Header from "@/components/layout/Header";
import ServiceMetrics from "@/components/services/ServiceMetrics";
import TraceList from "@/components/traces/TraceList";
import LogList from "@/components/logs/LogList";

interface ServiceDetailPageProps {
  params: Promise<{
    name: string;
  }>
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default async function ServiceDetailPage(p: ServiceDetailPageProps) {
  const params = await p.params;
  const router = useRouter();
  const { timeRange } = useFilterStore();
  const [activeTab, setActiveTab] = useState<string | number>("metrics");
  const [service, setService] = useState<ServiceMetric | null>(null);
  const [traces, setTraces] = useState<TraceItem[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const serviceName = decodeURIComponent(params.name);

  // 서비스 메트릭 데이터 가져오기
  const {
    data: serviceData,
    isLoading: isLoadingService,
    mutate: refreshService,
  } = useSWR(
    `/api/telemetry/services?startTime=${timeRange.startTime}&endTime=${timeRange.endTime}&serviceName=${encodeURIComponent(serviceName)}`,
    fetcher,
    { refreshInterval: 30000 }, // 30초마다 자동 갱신
  );

  // 트레이스 데이터 가져오기
  const { data: traceData, isLoading: isLoadingTraces } = useSWR(
    `/api/telemetry/traces?startTime=${timeRange.startTime}&endTime=${timeRange.endTime}&serviceName=${encodeURIComponent(serviceName)}&limit=20`,
    fetcher,
    { refreshInterval: 30000 }, // 30초마다 자동 갱신
  );

  // 로그 데이터 가져오기
  const { data: logData, isLoading: isLoadingLogs } = useSWR(
    `/api/telemetry/logs?startTime=${timeRange.startTime}&endTime=${timeRange.endTime}&serviceName=${encodeURIComponent(serviceName)}&limit=20`,
    fetcher,
    { refreshInterval: 30000 }, // 30초마다 자동 갱신
  );

  // 서비스 데이터 처리
  useEffect(() => {
    if (
      serviceData &&
      serviceData.services &&
      serviceData.services.length > 0
    ) {
      setService(serviceData.services[0]);
    }
  }, [serviceData]);

  // 트레이스 데이터 처리
  useEffect(() => {
    if (traceData && traceData.traces) {
      setTraces(traceData.traces);
    }
  }, [traceData]);

  // 로그 데이터 처리
  useEffect(() => {
    if (logData && logData.logs) {
      setLogs(logData.logs);
    }
  }, [logData]);

  // 뒤로 가기 핸들러
  const handleBack = () => {
    router.push("/services");
  };

  // 트레이스 상세 보기 핸들러
  const handleViewTrace = (trace: TraceItem) => {
    router.push(`/traces/${trace.traceId}`);
  };

  // 로그 상세 보기 핸들러
  const handleViewLog = (log: LogItem) => {
    router.push(`/logs/${log.id}`);
  };

  // 데이터 새로고침 핸들러
  const handleRefresh = () => {
    refreshService();
  };

  return (
    <>
      <Header title={`${serviceName} 서비스 상세`} />

      <div className="mt-4">
        <div className="flex justify-between items-center mb-4">
          <Button
            className="flex items-center gap-1"
            variant="ghost"
            onClick={handleBack}
          >
            <ArrowLeft size={16} />
            <span>서비스 목록으로</span>
          </Button>

          <Button
            className="flex items-center gap-1"
            variant="ghost"
            onClick={handleRefresh}
          >
            <RefreshCw size={16} />
            <span>새로고침</span>
          </Button>
        </div>

        <Tabs
          className="w-full mb-4"
          selectedKey={activeTab}
          onSelectionChange={setActiveTab}
        >
          <Tab key="metrics" title="메트릭" />
          <Tab key="traces" title="트레이스" />
          <Tab key="logs" title="로그" />
        </Tabs>

        {activeTab === "metrics" ? (
          isLoadingService || !service ? (
            <Card>
              <CardBody className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </CardBody>
            </Card>
          ) : (
            <ServiceMetrics height={500} service={service} />
          )
        ) : activeTab === "traces" ? (
          <TraceList
            isLoading={isLoadingTraces}
            traces={traces}
            onSelectTrace={handleViewTrace}
          />
        ) : (
          <LogList
            isLoading={isLoadingLogs}
            logs={logs}
            onSelectLog={handleViewLog}
          />
        )}
      </div>
    </>
  );
}
