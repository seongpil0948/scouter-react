"use client";
import React, { useCallback } from "react";
import { Badge } from "@heroui/badge";
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell 
} from "@heroui/table";

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
    // 상태에 따른 색상 함수 등 기존 코드 유지...

    // 계층 구조 렌더링 함수
    const renderSpanTree = useCallback(
      (span: Span, depth: number, childrenMap: Record<string, Span[]>) => {
        // 해당 함수 내부 코드 유지...
      },
      [selectedSpanId, traceData, formatDuration, setSelectedSpanId]
    );

    return (
      <Table 
        aria-label="스팬 트리" 
        removeWrapper
        className="min-w-[800px]"
      >
        <TableHeader>
          <TableColumn>이름</TableColumn>
          <TableColumn>서비스</TableColumn>
          <TableColumn>타임라인</TableColumn>
          <TableColumn align="end">지연 시간</TableColumn>
        </TableHeader>
        <TableBody>
          {rootSpans.map((span) => renderSpanTree(span, 0, childrenMap)) as any}
        </TableBody>
      </Table>
    );
  }
);

SpanTree.displayName = "SpanTree";