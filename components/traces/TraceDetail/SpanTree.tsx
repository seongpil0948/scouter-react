"use client";
import React, { useCallback } from "react";
import { Badge } from "@heroui/badge";
import { TableRow, TableCell } from "@heroui/table";
import { Tooltip } from "@heroui/tooltip";

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

export const SpanTree: React.FC<SpanTreeProps> = React.memo(
  ({
    rootSpans,
    childrenMap,
    selectedSpanId,
    setSelectedSpanId,
    traceData,
    formatDuration,
  }) => {
    // 상태에 따른 색상
    const getStatusColor = useCallback((status?: string) => {
      if (status === 'ERROR') return 'danger';
      if (status === 'OK') return 'success';
      return 'primary';
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
            <TableRow 
              key={span.spanId} 
              className={`${isSelected ? "bg-primary-50 dark:bg-primary-900/20" : ""} hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer`}
              onClick={() => setSelectedSpanId(span.spanId)}
            >
              <TableCell className="font-mono text-sm">
                <div style={{ marginLeft: `${depth * 16}px` }} className="flex items-center">
                  
                  <Tooltip content={span.name}>
                    <span className="truncate max-w-xs inline-block">
                      {span.name.length > 40 ? `${span.name.substring(0, 40)}...` : span.name}
                    </span>
                  </Tooltip>
                </div>
              </TableCell>
              <TableCell>
                <Badge color="primary" variant="flat">
                  {span.serviceName}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="relative h-6">
                  <Tooltip content={`${formatDuration(span.duration)} (${span.duration}ms)`}>
                    <div
                      aria-hidden="true"
                      className="absolute top-1/2 transform -translate-y-1/2 h-2 rounded-sm"
                      style={{
                        width: `${Math.min(spanWidth, 100)}%`,
                        left: `${Math.min(spanOffset, 100)}%`,
                        backgroundColor: span.status === 'ERROR' ? 'var(--danger)' : 'var(--primary)',
                      }}
                    />
                  </Tooltip>
                </div>
              </TableCell>
              <TableCell align="right" className="font-mono">
                {formatDuration(span.duration)}
              </TableCell>
            </TableRow>
            {children.map((child) =>
              renderSpanTree(child, depth + 1, childrenMap),
            )}
          </React.Fragment>
        );
      },
      [
        selectedSpanId,
        traceData,
        formatDuration,
        getStatusColor,
        setSelectedSpanId,
      ],
    );

    return <>{rootSpans.map((span) => renderSpanTree(span, 0, childrenMap))}</>;
  },
);

SpanTree.displayName = "SpanTree";