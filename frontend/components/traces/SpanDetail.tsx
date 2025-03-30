"use client";
import React, { useCallback } from "react";
import { Badge } from "@heroui/badge";
import { formatDateTime } from '@/lib/utils/dateFormatter';

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

interface SpanDetailProps {
  span: Span;
  formatDuration: (duration: number) => string;
}

export const SpanDetail: React.FC<SpanDetailProps> = React.memo(({
  span,
  formatDuration,
}) => {
  // 속성값 포맷팅
  const formatAttributeValue = useCallback((value: any) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  }, []);

  return (
    <div className="mt-4 space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">스팬 상세 정보</h3>
        <table className="w-full border-collapse">
          <tbody>
            <tr className="border-b">
              <td className="py-2 px-4 bg-gray-50 font-medium">이름</td>
              <td className="py-2 px-4 font-mono">{span.name}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 bg-gray-50 font-medium">스팬 ID</td>
              <td className="py-2 px-4 font-mono">{span.spanId}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 bg-gray-50 font-medium">부모 스팬 ID</td>
              <td className="py-2 px-4 font-mono">{span.parentSpanId || "-"}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 bg-gray-50 font-medium">서비스</td>
              <td className="py-2 px-4">{span.serviceName}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 bg-gray-50 font-medium">상태</td>
              <td className="py-2 px-4">
                <Badge
                  className={
                    span.status === "ERROR"
                      ? "bg-red-500"
                      : span.status === "OK"
                        ? "bg-green-500"
                        : "bg-gray-500"
                  }
                >
                  {span.status || "UNSET"}
                </Badge>
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 bg-gray-50 font-medium">시작 시간</td>
              <td className="py-2 px-4">{formatDateTime(span.startTime)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 bg-gray-50 font-medium">종료 시간</td>
              <td className="py-2 px-4">{formatDateTime(span.endTime)}</td>
            </tr>
            <tr>
              <td className="py-2 px-4 bg-gray-50 font-medium">지연 시간</td>
              <td className="py-2 px-4">{formatDuration(span.duration)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {span.attributes && Object.keys(span.attributes).length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">속성</h3>
          <div className="overflow-auto max-h-96">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-4 py-2 text-left">키</th>
                  <th className="border px-4 py-2 text-left">값</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(span.attributes)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([key, value]) => (
                    <tr key={key} className="hover:bg-gray-50">
                      <td className="border px-4 py-2 font-mono text-sm">
                        {key}
                      </td>
                      <td className="border px-4 py-2 font-mono text-sm break-all whitespace-pre-wrap">
                        {formatAttributeValue(value)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
});

SpanDetail.displayName = "SpanDetail";