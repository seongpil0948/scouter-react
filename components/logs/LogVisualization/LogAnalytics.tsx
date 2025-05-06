import React, { useMemo } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";
import { Chip } from "@heroui/chip";
import { CircularProgress } from "@heroui/progress";
import { Activity, AlertTriangle, Info, Database, Clock } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/dateFormatter";

import LogDistributionChart from "./LogDistributionChart";
import LogSeverityChart from "./LogSeverityChart";
import LogServiceChart from "./LogServiceChart";

interface LogAnalyticsProps {
  logs: LogItem[];
  isLoading?: boolean;
}

const LogAnalytics: React.FC<LogAnalyticsProps> = ({
  logs,
  isLoading = false,
}) => {
  // 통계 계산
  const statistics = useMemo(() => {
    if (!logs || logs.length === 0) {
      return {
        totalLogs: 0,
        errorCount: 0,
        warningCount: 0,
        infoCount: 0,
        serviceCount: 0,
        errorPercentage: 0,
        lastLogTime: 0,
        services: new Set<string>(),
      };
    }

    const services = new Set<string>();
    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;
    let lastLogTime = 0;

    logs.forEach((log) => {
      services.add(log.serviceName);

      const severity = log.severity.toUpperCase();
      if (severity === "ERROR" || severity === "FATAL") {
        errorCount++;
      } else if (severity === "WARN" || severity === "WARNING") {
        warningCount++;
      } else if (severity === "INFO") {
        infoCount++;
      }

      if (log.timestamp > lastLogTime) {
        lastLogTime = log.timestamp;
      }
    });

    return {
      totalLogs: logs.length,
      errorCount,
      warningCount,
      infoCount,
      serviceCount: services.size,
      errorPercentage: logs.length > 0 ? (errorCount / logs.length) * 100 : 0,
      lastLogTime,
      services,
    };
  }, [logs]);

  // 최근 에러 로그
  const recentErrorLogs = useMemo(() => {
    if (!logs || logs.length === 0) return [];

    return logs
      .filter((log) => {
        const severity = log.severity.toUpperCase();
        return severity === "ERROR" || severity === "FATAL";
      })
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  }, [logs]);

  if (isLoading) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center justify-center p-12">
          <CircularProgress aria-label="로그 데이터 로딩 중" />
          <p className="mt-4 text-gray-500">
            로그 데이터를 분석하는 중입니다...
          </p>
        </CardBody>
      </Card>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardBody className="flex items-center justify-center p-12">
          <div className="text-center text-gray-500">
            <AlertTriangle size={32} className="mx-auto mb-2" />
            <p>분석할 로그 데이터가 없습니다.</p>
            <p className="text-sm mt-2">
              필터를 조정하거나 다른 시간 범위를 선택해 보세요.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 요약 통계 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
        <div>
          <Card className="w-full">
            <CardBody className="flex flex-col items-center justify-center">
              <div className="text-sm text-gray-500">총 로그 수</div>
              <div className="text-3xl font-bold mt-2">
                {statistics.totalLogs}
              </div>
            </CardBody>
          </Card>
        </div>

        <div>
          <Card className="w-full">
            <CardBody className="flex flex-col items-center justify-center">
              <div className="text-sm text-gray-500">서비스 수</div>
              <div className="text-3xl font-bold mt-2">
                {statistics.serviceCount}
              </div>
            </CardBody>
          </Card>
        </div>

        <div>
          <Card className="w-full">
            <CardBody className="flex flex-col items-center justify-center">
              <div className="text-sm text-gray-500">에러 로그</div>
              <div className="flex items-center mt-2">
                <span className="text-3xl font-bold text-red-500">
                  {statistics.errorCount}
                </span>
                <Chip className="ml-2" color="danger" size="sm">
                  {statistics.errorPercentage.toFixed(1)}%
                </Chip>
              </div>
            </CardBody>
          </Card>
        </div>

        <div>
          <Card className="w-full">
            <CardBody className="flex flex-col items-center justify-center">
              <div className="text-sm text-gray-500">마지막 로그</div>
              <div className="text-xl font-bold mt-2">
                {formatRelativeTime(statistics.lastLogTime)}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* 시각화 차트 */}
      <Tabs aria-label="로그 분석 탭">
        <Tab
          key="overview"
          title={
            <div className="flex items-center">
              <Activity size={16} className="mr-1" />
              시간별 분포
            </div>
          }
        >
          <LogDistributionChart logs={logs} height={400} />
        </Tab>

        <Tab
          key="severity"
          title={
            <div className="flex items-center">
              <AlertTriangle size={16} className="mr-1" />
              심각도별 분포
            </div>
          }
        >
          <LogSeverityChart logs={logs} height={400} />
        </Tab>

        <Tab
          key="services"
          title={
            <div className="flex items-center">
              <Database size={16} className="mr-1" />
              서비스별 분포
            </div>
          }
        >
          <LogServiceChart logs={logs} height={400} />
        </Tab>

        <Tab
          key="errors"
          title={
            <div className="flex items-center">
              <AlertTriangle size={16} className="mr-1" />
              최근 에러 ({recentErrorLogs.length})
            </div>
          }
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">최근 에러 로그</h3>
            </CardHeader>
            <CardBody>
              {recentErrorLogs.length > 0 ? (
                <div className="space-y-4">
                  {recentErrorLogs.map((log) => (
                    <div key={log.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-center mb-1">
                        <AlertTriangle
                          size={16}
                          className="text-red-500 mr-1"
                        />
                        <Chip color="danger" size="sm" className="mr-2">
                          {log.severity}
                        </Chip>
                        <span className="text-sm text-gray-500">
                          {formatRelativeTime(log.timestamp)}
                        </span>
                        <Chip color="primary" size="sm" className="ml-auto">
                          {log.serviceName}
                        </Chip>
                      </div>
                      <p className="font-mono text-sm whitespace-pre-wrap">
                        {log.message}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Info size={32} className="mx-auto mb-2" />
                  <p>에러 로그가 없습니다</p>
                </div>
              )}
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default LogAnalytics;
