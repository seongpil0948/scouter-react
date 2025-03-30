"use client";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";

import {
  useFilterStore,
  useTelemetryStore,
  TraceItem,
} from "@/lib/store/telemetryStore";
import Header from "@/components/layout/Header";
import TraceList from "@/components/traces/TraceList";
import TraceDetail from "@/components/traces/TraceDetail";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TracesPage() {
  const router = useRouter();
  const { traceFilters, timeRange } = useFilterStore();
  const { setIsLoadingTraces, isLoadingTraces } = useTelemetryStore();
  const [selectedTrace, setSelectedTrace] = useState<TraceItem | null>(null);
  const [traceData, setTraceData] = useState<any | null>(null);
  const [traces, setTraces] = useState<TraceItem[]>([]);

  // 트레이스 목록 가져오기
  const { data, error, isLoading } = useSWR(
    `/api/telemetry/traces?startTime=${timeRange.startTime}&endTime=${timeRange.endTime}${
      traceFilters.service ? `&serviceName=${traceFilters.service}` : ""
    }${traceFilters.status ? `&status=${traceFilters.status}` : ""}${
      traceFilters.minDuration ? `&minDuration=${traceFilters.minDuration}` : ""
    }${traceFilters.maxDuration ? `&maxDuration=${traceFilters.maxDuration}` : ""}${
      traceFilters.search
        ? `&query=${encodeURIComponent(traceFilters.search)}`
        : ""
    }`,
    fetcher,
    { refreshInterval: 30000 }, // 30초마다 자동 갱신
  );

  // 트레이스 상세 데이터 가져오기
  const {
    data: detailData,
    error: detailError,
    isLoading: isLoadingDetail,
  } = useSWR(
    selectedTrace ? `/api/telemetry/traces/${selectedTrace.traceId}` : null,
    fetcher,
  );

  // 로딩 상태 업데이트
  useEffect(() => {
    setIsLoadingTraces(isLoading);
  }, [isLoading, setIsLoadingTraces]);

  // 트레이스 목록 데이터 처리
  useEffect(() => {
    if (data && data.traces) {
      setTraces(data.traces);
    }
  }, [data]);

  // 트레이스 상세 데이터 처리
  useEffect(() => {
    if (detailData) {
      setTraceData(detailData);
    }
  }, [detailData]);

  // 트레이스 선택 핸들러
  const handleSelectTrace = (trace: TraceItem) => {
    setSelectedTrace(trace);
  };

  // 뒤로 가기 핸들러
  const handleBack = () => {
    setSelectedTrace(null);
    setTraceData(null);
  };

  return (
    <>
      <Header title="트레이스 분석" />

      <div className="mt-4">
        {selectedTrace && traceData ? (
          <TraceDetail traceId={traceData.traceId} />
        ) : (
          <TraceList
            isLoading={isLoadingTraces}
            traces={traces}
            onSelectTrace={handleSelectTrace}
          />
        )}
      </div>
    </>
  );
}
