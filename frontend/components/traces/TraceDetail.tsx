"use client";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import React, { useCallback, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";
import { CopyIcon, ArrowLeft, EyeIcon } from "lucide-react";

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

interface TraceDetailProps {
  traceData: TraceData | null;
  onBack?: () => void;
}

const TraceDetail: React.FC<TraceDetailProps> = ({ traceData, onBack }) => {
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | number>("timeline");

  // 선택된 스팬 가져오기
  const selectedSpan = selectedSpanId
    ? traceData?.spans.find((span) => span.spanId === selectedSpanId)
    : null;

  // 스팬 계층 구조 구성
  const spanHierarchy = useCallback(() => {
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

    return { rootSpans, childrenMap };
  }, [traceData]);

  // 계층 구조 렌더링 함수
  const renderSpanTree = useCallback(
    (span: any, depth: number, childrenMap: Record<string, Span[]>) => {
      const children = childrenMap[span.spanId] || [];
      const isSelected = selectedSpanId === span.spanId;
      const totalDuration = traceData
        ? traceData.endTime - traceData.startTime
        : 0;
      const spanWidth =
        totalDuration > 0 ? (span.duration / totalDuration) * 100 : 0;
      const spanOffset =
        totalDuration > 0
          ? ((span.startTime - (traceData?.startTime || 0)) / totalDuration) *
            100
          : 0;

      // 상태에 따른 색상
      const getStatusColor = (status?: string) => {
        if (status === "ERROR") return "bg-red-500";
        if (status === "OK") return "bg-green-500";

        return "bg-blue-500";
      };

      return (
        <React.Fragment key={span.spanId}>
          <div
            className={`mb-1 pl-${depth * 4} cursor-pointer hover:bg-gray-50 ${
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
                    width: `${spanWidth}%`,
                    left: `${spanOffset}%`,
                    backgroundColor: getStatusColor(span.status),
                  }}
                />
              </div>
              <div className="w-2/12 text-right font-mono text-sm">
                {formatDuration(span.duration)}
              </div>
            </div>
          </div>
          {children.map((child) =>
            renderSpanTree(child, depth + 1, childrenMap),
          )}
        </React.Fragment>
      );
    },
    [selectedSpanId, traceData],
  );

  // 시간 포맷팅
  const formatTime = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleString();
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

  // 클립보드 복사
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  // 속성값 포맷팅
  const formatAttributeValue = useCallback((value: any) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "object") return JSON.stringify(value);

    return String(value);
  }, []);

  if (!traceData) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-lg">
        <p className="text-gray-500">트레이스를 선택하세요</p>
      </div>
    );
  }

  const hierarchy = spanHierarchy();
  const { rootSpans, childrenMap } = hierarchy;

  return (
    <Card className="bg-white rounded-lg shadow-lg overflow-hidden">
      <h2 className="bg-gray-50 border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button title="뒤로 가기" variant="ghost" onClick={onBack}>
              <ArrowLeft size={18} />
            </Button>
            <h2 className="text-xl">트레이스 상세</h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(traceData.traceId)}
            >
              <CopyIcon className="mr-1" size={16} />
              트레이스 ID 복사
            </Button>
          </div>
        </div>
      </h2>

      <Tabs
        className="w-full"
        selectedKey={activeTab}
        onSelectionChange={setActiveTab}
      >
        <Tab key="timeline" title="타임라인" />
        <Tab key="details" title="상세 정보" />
        {selectedSpan && <Tab key="span" title="선택된 스팬" />}
      </Tabs>

      <CardBody className="p-6">
        <Tab key="timeline" className="mt-4">
          <div className="mb-4 bg-gray-50 p-4 rounded-md">
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-gray-500">트레이스 ID:</span>
                <span className="font-mono ml-2">
                  {traceData.traceId.substring(0, 8)}...
                </span>
              </div>
              <div>
                <span className="text-gray-500">시작 시간:</span>
                <span className="font-mono ml-2">
                  {formatTime(traceData.startTime)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">총 지연 시간:</span>
                <span className="font-mono ml-2">
                  {formatDuration(traceData.endTime - traceData.startTime)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">스팬 수:</span>
                <span className="font-mono ml-2">{traceData.spans.length}</span>
              </div>
              <div>
                <span className="text-gray-500">서비스:</span>
                <span className="ml-2">
                  {traceData.services.map((service) => (
                    <Badge
                      key={service}
                      className="mr-1 bg-blue-100 text-blue-800"
                    >
                      {service}
                    </Badge>
                  ))}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* 타임라인 헤더 */}
              <div className="flex items-center pb-2 border-b font-semibold text-sm">
                <div className="w-3/12">이름</div>
                <div className="w-2/12">서비스</div>
                <div className="w-5/12">타임라인</div>
                <div className="w-2/12 text-right">지연 시간</div>
              </div>

              {/* 스팬 타임라인 */}
              <div className="mt-2">
                {rootSpans.map((span) => renderSpanTree(span, 0, childrenMap))}
              </div>
            </div>
          </div>
        </Tab>

        <Tab key="details" className="mt-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">트레이스 정보</h3>
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-4 bg-gray-50 font-medium">
                      트레이스 ID
                    </td>
                    <td className="py-2 px-4 font-mono">{traceData.traceId}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4 bg-gray-50 font-medium">
                      시작 시간
                    </td>
                    <td className="py-2 px-4">
                      {formatTime(traceData.startTime)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4 bg-gray-50 font-medium">
                      종료 시간
                    </td>
                    <td className="py-2 px-4">
                      {formatTime(traceData.endTime)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4 bg-gray-50 font-medium">
                      총 지연 시간
                    </td>
                    <td className="py-2 px-4">
                      {formatDuration(traceData.endTime - traceData.startTime)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4 bg-gray-50 font-medium">
                      스팬 수
                    </td>
                    <td className="py-2 px-4">{traceData.spans.length}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 bg-gray-50 font-medium">서비스</td>
                    <td className="py-2 px-4">
                      {traceData.services.map((service) => (
                        <Badge
                          key={service}
                          className="mr-1 bg-blue-100 text-blue-800"
                        >
                          {service}
                        </Badge>
                      ))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">스팬 목록</h3>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border px-4 py-2 text-left">이름</th>
                      <th className="border px-4 py-2 text-left">서비스</th>
                      <th className="border px-4 py-2 text-left">상태</th>
                      <th className="border px-4 py-2 text-right">지연 시간</th>
                      <th className="border px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {traceData.spans.map((span) => (
                      <tr key={span.spanId} className="hover:bg-gray-50">
                        <td className="border px-4 py-2 font-mono text-sm">
                          {span.name}
                        </td>
                        <td className="border px-4 py-2">{span.serviceName}</td>
                        <td className="border px-4 py-2">
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
                        <td className="border px-4 py-2 text-right font-mono">
                          {formatDuration(span.duration)}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedSpanId(span.spanId)}
                          >
                            <EyeIcon size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Tab>

        {selectedSpan && (
          <Tab key="span" className="mt-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">스팬 상세 정보</h3>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 px-4 bg-gray-50 font-medium">이름</td>
                      <td className="py-2 px-4 font-mono">
                        {selectedSpan.name}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-4 bg-gray-50 font-medium">
                        스팬 ID
                      </td>
                      <td className="py-2 px-4 font-mono">
                        {selectedSpan.spanId}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-4 bg-gray-50 font-medium">
                        부모 스팬 ID
                      </td>
                      <td className="py-2 px-4 font-mono">
                        {selectedSpan.parentSpanId || "-"}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-4 bg-gray-50 font-medium">
                        서비스
                      </td>
                      <td className="py-2 px-4">{selectedSpan.serviceName}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-4 bg-gray-50 font-medium">상태</td>
                      <td className="py-2 px-4">
                        <Badge
                          className={
                            selectedSpan.status === "ERROR"
                              ? "bg-red-500"
                              : selectedSpan.status === "OK"
                                ? "bg-green-500"
                                : "bg-gray-500"
                          }
                        >
                          {selectedSpan.status || "UNSET"}
                        </Badge>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-4 bg-gray-50 font-medium">
                        시작 시간
                      </td>
                      <td className="py-2 px-4">
                        {formatTime(selectedSpan.startTime)}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-4 bg-gray-50 font-medium">
                        종료 시간
                      </td>
                      <td className="py-2 px-4">
                        {formatTime(selectedSpan.endTime)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 bg-gray-50 font-medium">
                        지연 시간
                      </td>
                      <td className="py-2 px-4">
                        {formatDuration(selectedSpan.duration)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {selectedSpan.attributes &&
                Object.keys(selectedSpan.attributes).length > 0 && (
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
                          {Object.entries(selectedSpan.attributes)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([key, value]) => (
                              <tr key={key} className="hover:bg-gray-50">
                                <td className="border px-4 py-2 font-mono text-sm">
                                  {key}
                                </td>
                                <td className="border px-4 py-2 font-mono text-sm break-all">
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
          </Tab>
        )}
      </CardBody>
    </Card>
  );
};

export default TraceDetail;
