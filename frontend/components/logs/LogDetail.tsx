import React, { useCallback, useState } from "react";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { Card, CardBody } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";
import {
  CopyIcon,
  ExternalLinkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { LogItem } from "@/lib/store/telemetryStore";
import { formatDateTime } from "@/lib/utils/dateFormatter"; // 유틸리티 함수 임포트

interface LogDetailProps {
  log: LogItem | null;
  onClose?: () => void;
  onViewTrace?: (traceId: string) => void;
  onViewNext?: () => void;
  onViewPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

const LogDetail: React.FC<LogDetailProps> = ({
  log,
  onClose,
  onViewTrace,
  onViewNext,
  onViewPrevious,
  hasNext = false,
  hasPrevious = false,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string | number>("details");

  // 심각도에 따른 배지 색상
  const getSeverityBadgeColor = useCallback((severity: string) => {
    const severityMap: Record<string, string> = {
      FATAL: "bg-red-700 hover:bg-red-800",
      ERROR: "bg-red-500 hover:bg-red-600",
      WARN: "bg-yellow-500 hover:bg-yellow-600",
      INFO: "bg-blue-500 hover:bg-blue-600",
      DEBUG: "bg-gray-500 hover:bg-gray-600",
      TRACE: "bg-gray-400 hover:bg-gray-500",
    };

    return severityMap[severity] || "bg-gray-500 hover:bg-gray-600";
  }, []);

  // 속성값 포맷팅
  const formatAttributeValue = useCallback((value: any) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "object") return JSON.stringify(value);

    return String(value);
  }, []);

  // 클립보드 복사
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    // 여기에 복사 성공 알림 추가 가능
  }, []);

  // 트레이스 보기 핸들러
  const handleViewTrace = useCallback(() => {
    if (log?.traceId && onViewTrace) {
      onViewTrace(log.traceId);
    } else if (log?.traceId) {
      router.push(`/traces/${log.traceId}`);
    }
  }, [log, onViewTrace, router]);

  if (!log) {
    return (
      <Card>
        <CardBody className="flex items-center justify-center h-64">
          <p className="text-gray-500">로그를 선택하세요</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="bg-gray-50 border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Badge className={getSeverityBadgeColor(log.severity)}>
              {log.severity}
            </Badge>
            <h2 className="text-xl">{log.serviceName}</h2>
          </div>

          <div className="flex items-center gap-2">
            {hasPrevious && (
              <Button
                title="이전 로그"
                variant="ghost"
                onClick={onViewPrevious}
              >
                <ChevronLeftIcon size={18} />
              </Button>
            )}

            {hasNext && (
              <Button title="다음 로그" variant="ghost" onClick={onViewNext}>
                <ChevronRightIcon size={18} />
              </Button>
            )}

            {onClose && (
              <Button variant="ghost" onClick={onClose}>
                닫기
              </Button>
            )}
          </div>
        </div>
      </h2>

      <Tabs
        className="w-full"
        selectedKey={activeTab}
        onSelectionChange={setActiveTab}
      >
        <Tab key="details" title="상세 정보">
          <CardBody className="p-6">
            <div className="space-y-6">
              {/* 시간 정보 */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">시간</h3>
                <p className="text-lg font-medium text-gray-900">
                  {formatDateTime(log.timestamp)}
                </p>
              </div>

              {/* 메시지 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-medium text-gray-500">메시지</h3>
                  <Button
                    className="h-6 px-2"
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(log.message)}
                  >
                    <CopyIcon className="mr-1" size={14} />
                    복사
                  </Button>
                </div>
                <div className="bg-gray-50 rounded-md p-4 overflow-auto max-h-80">
                  <pre className="whitespace-pre-wrap break-words text-sm">
                    {log.message}
                  </pre>
                </div>
              </div>

              {/* 트레이스 ID (있는 경우) */}
              {log.traceId && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-medium text-gray-500">
                      트레이스 ID
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button
                        className="h-6 px-2"
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(log.traceId || "")}
                      >
                        <CopyIcon className="mr-1" size={14} />
                        복사
                      </Button>
                      <Button
                        className="h-6 px-2"
                        size="sm"
                        variant="ghost"
                        onClick={handleViewTrace}
                      >
                        <ExternalLinkIcon className="mr-1" size={14} />
                        트레이스 보기
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm font-mono break-all bg-gray-50 p-2 rounded">
                    {log.traceId}
                  </p>
                </div>
              )}

              {/* 스팬 ID (있는 경우) */}
              {log.spanId && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    스팬 ID
                  </h3>
                  <p className="text-sm font-mono break-all bg-gray-50 p-2 rounded">
                    {log.spanId}
                  </p>
                </div>
              )}
            </div>
          </CardBody>
        </Tab>
        <Tab key="attributes" title="속성">
          <CardBody className="p-6">
            <div className="overflow-auto max-h-96">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border px-4 py-2 text-left text-sm font-medium text-gray-500">
                      키
                    </th>
                    <th className="border px-4 py-2 text-left text-sm font-medium text-gray-500">
                      값
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {log.attributes &&
                  Object.entries(log.attributes).length > 0 ? (
                    Object.entries(log.attributes)
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
                      ))
                  ) : (
                    <tr>
                      <td
                        className="border px-4 py-4 text-center text-gray-500"
                        colSpan={2}
                      >
                        속성 정보가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Tab>
        {log.traceId && (
          <Tab key="trace" title="트레이스">
            <CardBody className="p-6">
              <div className="flex flex-col items-center justify-center p-6 gap-4">
                <p className="text-gray-600">
                  이 로그는 트레이스 ID{" "}
                  <span className="font-mono">
                    {log.traceId.substring(0, 8)}...
                  </span>
                  와 연결되어 있습니다.
                </p>
                <Button onClick={handleViewTrace}>
                  <ExternalLinkIcon className="mr-2" size={16} />
                  트레이스 상세 보기
                </Button>
              </div>
            </CardBody>
          </Tab>
        )}
      </Tabs>
    </Card>
  );
};

export default LogDetail;