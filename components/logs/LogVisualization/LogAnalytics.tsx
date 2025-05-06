import React from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { Chip } from "@heroui/chip";
import { Activity, AlertTriangle, Info, Database } from "lucide-react";
import LogDistributionChart from "./LogDistributionChart";
import LogSeverityChart from "./LogSeverityChart";
import LogServiceChart from "./LogServiceChart";
import { formatRelativeTime } from "@/lib/utils/dateFormatter";
import { computeLogStatistics, getRecentErrorLogs } from "@/lib/utils/logUtils";
import SummaryCard from "@/components/shared/SummaryCard";
import LoadingCard from "@/components/shared/LoadingCard";
import EmptyStateCard from "@/components/shared/EmptyStateCard";
import { Card, CardBody, CardHeader } from "@heroui/card";

interface LogAnalyticsProps {
  logs: LogItem[];
  isLoading?: boolean;
}

const LogAnalytics: React.FC<LogAnalyticsProps> = ({
  logs,
  isLoading = false,
}) => {
  const stats = computeLogStatistics(logs);
  const recentErrors = getRecentErrorLogs(logs);

  if (isLoading)
    return <LoadingCard message="로그 데이터를 분석하는 중입니다..." />;
  if (logs.length === 0)
    return (
      <EmptyStateCard
        icon={<AlertTriangle size={32} className="mx-auto mb-2" />}
        title="분석할 로그 데이터가 없습니다."
        subtitle="필터를 조정하거나 다른 시간 범위를 선택해 보세요."
      />
    );

  return (
    <div className="space-y-4">
      {/* 요약 통계 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
        <div>
          <SummaryCard title="총 로그 수" value={stats.totalLogs} />
        </div>
        <div>
          <SummaryCard title="서비스 수" value={stats.serviceCount} />
        </div>
        <div>
          <SummaryCard
            title="에러 로그"
            value={<span className="text-red-500">{stats.errorCount}</span>}
            badge={
              <Chip color="danger" size="sm">
                {stats.errorPercentage.toFixed(1)}%
              </Chip>
            }
          />
        </div>
        <div>
          <SummaryCard
            title="마지막 로그"
            value={formatRelativeTime(stats.lastLogTime)}
          />
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
              최근 에러 ({recentErrors.length})
            </div>
          }
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">최근 에러 로그</h3>
            </CardHeader>
            <CardBody>
              {recentErrors.length > 0 ? (
                <div className="space-y-4">
                  {recentErrors.map((log) => (
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
