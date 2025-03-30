"use client";
import React, { useCallback } from "react";

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

interface SpanTreeProps {
  rootSpans: Span[];
  childrenMap: Record<string, Span[]>;
  selectedSpanId: string | null;
  setSelectedSpanId: (spanId: string) => void;
  traceData: TraceData;
  formatDuration: (duration: number) => string;
}

export const SpanTree: React.FC<SpanTreeProps> = React.memo(({
  rootSpans,
  childrenMap,
  selectedSpanId,
  setSelectedSpanId,
  traceData,
  formatDuration,
}) => {
  // 상태에 따른 색상
  const getStatusColor = useCallback((status?: string) => {
    if (status === "ERROR") return "bg-red-500";
    if (status === "OK") return "bg-green-500";
    return "bg-blue-500";
  }, []);

  // 계층 구조 렌더링 함수
  const renderSpanTree = useCallback(
    (span: Span, depth: number, childrenMap: Record<string, Span[]>) => {
      const children = childrenMap[span.spanId] || [];
      const isSelected = selectedSpanId === span.spanId;
      const totalDuration = traceData
        ? traceData.endTime - traceData.startTime
        : 0;
      const spanWidth =
        totalDuration > 0 ? (span.duration / totalDuration) * 100 : 0;
      const spanOffset =
        totalDuration > 0
          ? ((span.startTime - traceData.startTime) / totalDuration) * 100
          : 0;

      return (
        <React.Fragment key={span.spanId}>
          <div
            className={`mb-1 cursor-pointer hover:bg-gray-50 ${
              isSelected ? "bg-blue-50" : ""
            }`}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedSpanId(span.spanId)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedSpanId(span.spanId);
              }
            }}
          >
            <div className="flex items-center p-2">
              <div className="w-3/12 flex items-center overflow-hidden">
                <div style={{ marginLeft: `${depth * 16}px` }}>
                  <span
                    className={`w-2 h-2 inline-block rounded-full mr-2 ${getStatusColor(span.status)}`}
                    aria-hidden="true"
                  />
                  <span className="font-mono text-sm truncate">
                    {span.name}
                  </span>
                </div>
              </div>
              <div className="w-2/12 font-mono text-sm truncate">
                {span.serviceName}
              </div>
              <div className="w-5/12 relative h-6">
                <div
                  className="absolute top-1/2 transform -translate-y-1/2 h-2 rounded"
                  style={{
                    width: `${Math.min(spanWidth, 100)}%`,
                    left: `${Math.min(spanOffset, 100)}%`,
                    backgroundColor: getStatusColor(span.status),
                  }}
                  title={`지연 시간: ${formatDuration(span.duration)}`}
                  aria-hidden="true"
                />
              </div>
              <div className="w-2/12 text-right font-mono text-sm">
                {formatDuration(span.duration)}
              </div>
            </div>
          </div>
          {children.map((child) =>
            renderSpanTree(child, depth + 1, childrenMap)
          )}
        </React.Fragment>
      );
    },
    [selectedSpanId, traceData, formatDuration, getStatusColor, setSelectedSpanId]
  );

  return (
    <>
      {rootSpans.map((span) => renderSpanTree(span, 0, childrenMap))}
    </>
  );
});

SpanTree.displayName = "SpanTree";