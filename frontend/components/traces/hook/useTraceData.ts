"use client";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

interface Span {
  id: string;
  name: string;
  serviceName: string;
  startTime: number;
  endTime: number;
  duration: number;
  parentSpanId?: string;
  attributes?: Record<string, any>;
  status?: string;
  traceId: string;
  spanId: string;
}

interface TraceData {
  traceId: string;
  spans: Span[];
  startTime: number;
  endTime: number;
  services: string[];
  total: number;
}

// API 요청 처리 함수
const fetcher = (url: string) =>
  fetch(url)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`API 요청 실패: ${res.status}`);
      }
      return res.json();
    })
    .catch((error) => {
      console.error("API 요청 오류:", error);
      throw error;
    });

export const useTraceData = (traceId: string) => {
  // SWR을 사용하여 트레이스 데이터 가져오기
  const {
    data: traceData,
    error,
    isLoading,
  } = useSWR<TraceData>(
    traceId ? `/api/telemetry/traces/${traceId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30초 동안 중복 요청 방지
      errorRetryCount: 3,
    },
  );

  // 시간 포맷팅
  const formatTime = useCallback((timestamp: number) => {
    console.log("timestamp", timestamp);
    return new Date(timestamp).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }, []);

  // 지연 시간 포맷팅
  const formatDuration = useCallback((duration: number) => {
    if (duration < 1) {
      return "<1ms";
    }
    if (duration < 1000) {
      return `${duration.toFixed(2)}ms`;
    }
    return `${(duration / 1000).toFixed(2)}s`;
  }, []);

  // 스팬 계층 구조 구성
  const spanHierarchy = useMemo(() => {
    if (!traceData) return { rootSpans: [], childrenMap: {} };

    const rootSpans: Span[] = [];
    const childrenMap: Record<string, Span[]> = {};

    // 먼저 모든 자식 스팬 맵 생성
    traceData.spans.forEach((span) => {
      if (span.parentSpanId) {
        if (!childrenMap[span.parentSpanId]) {
          childrenMap[span.parentSpanId] = [];
        }
        childrenMap[span.parentSpanId].push(span);
      } else {
        rootSpans.push(span);
      }
    });

    // 자식 스팬 정렬 (시작 시간순)
    Object.keys(childrenMap).forEach((parentId) => {
      childrenMap[parentId].sort((a, b) => a.startTime - b.startTime);
    });

    // 루트 스팬 정렬 (시작 시간순)
    rootSpans.sort((a, b) => a.startTime - b.startTime);

    return { rootSpans, childrenMap };
  }, [traceData]);

  return {
    traceData,
    error,
    isLoading,
    formatTime,
    formatDuration,
    spanHierarchy,
  };
};
