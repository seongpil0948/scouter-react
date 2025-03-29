"use client";
import React, { useState, useCallback } from "react";
import { Card, CardBody } from "@heroui/card";
import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import {
  FilterIcon,
  XIcon,
  RefreshCw,
  Clock,
  AlertTriangle,
  Server,
  GitBranch,
} from "lucide-react";

import { useFilterStore } from "@/lib/store/telemetryStore";

interface LogFiltersProps {
  services?: Array<{ name: string; count: number }>;
  severities?: Array<{ name: string; count: number }>;
  onApplyFilters?: () => void;
}

const LogFilters: React.FC<LogFiltersProps> = ({
  services = [],
  severities = [],
  onApplyFilters,
}) => {
  const { logFilters, setLogFilters, resetLogFilters } = useFilterStore();
  const [localFilters, setLocalFilters] = useState({ ...logFilters });

  // 서비스 필터 토글
  const toggleServiceFilter = useCallback((serviceName: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      service: prev.service === serviceName ? null : serviceName,
    }));
  }, []);

  // 심각도 필터 토글
  const toggleSeverityFilter = useCallback((severity: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      severity: prev.severity === severity ? null : severity,
    }));
  }, []);

  // 트레이스 연결 필터 토글
  const toggleTraceFilter = useCallback(() => {
    setLocalFilters((prev) => ({
      ...prev,
      hasTrace: !prev.hasTrace,
    }));
  }, []);

  // 필터 적용
  const applyFilters = useCallback(() => {
    setLogFilters(localFilters);
    onApplyFilters?.();
  }, [localFilters, setLogFilters, onApplyFilters]);

  // 필터 초기화
  const resetFilters = useCallback(() => {
    resetLogFilters();
    setLocalFilters({
      service: null,
      severity: null,
      search: "",
      hasTrace: false,
    });
  }, [resetLogFilters]);

  // 서비스명 필터에 따른 배지 색상
  const getServiceBadgeClass = useCallback(
    (serviceName: string) => {
      return localFilters.service === serviceName
        ? "bg-blue-500 hover:bg-blue-600 text-white"
        : "bg-gray-200 text-gray-700 hover:bg-gray-300";
    },
    [localFilters.service],
  );

  // 심각도 필터에 따른 배지 색상
  const getSeverityBadgeClass = useCallback(
    (severity: string) => {
      if (localFilters.severity !== severity) {
        return "bg-gray-200 text-gray-700 hover:bg-gray-300";
      }

      const severityColors: Record<string, string> = {
        FATAL: "bg-red-700 hover:bg-red-800",
        ERROR: "bg-red-500 hover:bg-red-600",
        WARN: "bg-yellow-500 hover:bg-yellow-600",
        INFO: "bg-blue-500 hover:bg-blue-600",
        DEBUG: "bg-gray-500 hover:bg-gray-600",
        TRACE: "bg-gray-400 hover:bg-gray-500",
      };

      return severityColors[severity] || "bg-gray-500 hover:bg-gray-600";
    },
    [localFilters.severity],
  );

  // 시간 범위 포맷팅
  const formatTimeRange = useCallback(() => {
    const start = new Date(logFilters.startTime || Date.now() - 3600000);
    const end = new Date(logFilters.endTime || Date.now());

    return `${start.toLocaleDateString()} ${start.toLocaleTimeString()} ~ ${end.toLocaleDateString()} ${end.toLocaleTimeString()}`;
  }, [logFilters.startTime, logFilters.endTime]);

  return (
    <Card>
      <h2 className="pb-2">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium">로그 필터</h2>
          <Button
            className="text-gray-500"
            size="sm"
            variant="ghost"
            onClick={resetFilters}
          >
            <RefreshCw className="mr-1" size={14} />
            초기화
          </Button>
        </div>
      </h2>

      <CardBody>
        {/* 서비스 필터 */}
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2 flex items-center">
            <Server className="mr-1 text-gray-500" size={16} />
            서비스
          </h3>
          {services.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {services.map((service) => (
                <Badge
                  key={service.name}
                  className={`cursor-pointer ${getServiceBadgeClass(service.name)}`}
                  onClick={() => toggleServiceFilter(service.name)}
                >
                  {service.name}
                  {service.count > 0 && (
                    <span className="ml-1">({service.count})</span>
                  )}
                  {localFilters.service === service.name && (
                    <XIcon className="ml-1" size={14} />
                  )}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">서비스 정보가 없습니다.</p>
          )}
        </div>

        {/* 심각도 필터 */}
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2 flex items-center">
            <AlertTriangle className="mr-1 text-gray-500" size={16} />
            심각도
          </h3>
          <div className="flex flex-wrap gap-2">
            {severities.length > 0
              ? severities.map((severity) => (
                  <Badge
                    key={severity.name}
                    className={`cursor-pointer ${getSeverityBadgeClass(severity.name)}`}
                    onClick={() => toggleSeverityFilter(severity.name)}
                  >
                    {severity.name}
                    {severity.count > 0 && (
                      <span className="ml-1">({severity.count})</span>
                    )}
                    {localFilters.severity === severity.name && (
                      <XIcon className="ml-1" size={14} />
                    )}
                  </Badge>
                ))
              : ["ERROR", "WARN", "INFO", "DEBUG"].map((severity) => (
                  <Badge
                    key={severity}
                    className={`cursor-pointer ${getSeverityBadgeClass(severity)}`}
                    onClick={() => toggleSeverityFilter(severity)}
                  >
                    {severity}
                    {localFilters.severity === severity && (
                      <XIcon className="ml-1" size={14} />
                    )}
                  </Badge>
                ))}
          </div>
        </div>

        {/* 트레이스 연결 필터 */}
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2 flex items-center">
            <GitBranch className="mr-1 text-gray-500" size={16} />
            트레이스 연결
          </h3>
          <Badge
            className={`cursor-pointer ${
              localFilters.hasTrace
                ? "bg-purple-500 hover:bg-purple-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={toggleTraceFilter}
          >
            트레이스 연결된 로그만 표시
            {localFilters.hasTrace && <XIcon className="ml-1" size={14} />}
          </Badge>
        </div>

        {/* 시간 범위 */}
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2 flex items-center">
            <Clock className="mr-1 text-gray-500" size={16} />
            시간 범위
          </h3>
          <p className="text-sm font-mono bg-gray-50 p-2 rounded">
            {formatTimeRange()}
          </p>
        </div>

        {/* 적용 버튼 */}
        <Button className="w-full" color="primary" onClick={applyFilters}>
          <FilterIcon className="mr-1" size={16} />
          필터 적용
        </Button>
      </CardBody>
    </Card>
  );
};

export default LogFilters;
