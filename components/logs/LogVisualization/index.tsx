import React, { useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";
import { useDisclosure } from "@heroui/modal";
import { BarChart2, List, Clock, AlertTriangle } from "lucide-react";

import LogTable from "@/components/logs/LogTable";
import LogAnalytics from "./LogAnalytics";
import LogDetail from "@/components/logs/LogDetail";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
} from "@heroui/drawer";
import { Button } from "@heroui/button";
import { X } from "lucide-react";

interface LogVisualizationProps {
  logs: LogItem[];
  isLoading?: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSelectLog: (log: LogItem) => void;
  selectedLog: LogItem | null;
  onViewTrace?: (traceId: string) => void;
}

const LogVisualization: React.FC<LogVisualizationProps> = ({
  logs,
  isLoading = false,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onSelectLog,
  selectedLog,
  onViewTrace,
}) => {
  const [activeTab, setActiveTab] = useState<string>("list");
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();

  // 선택된 로그 처리
  const handleSelectLog = (log: LogItem) => {
    onSelectLog(log);
    onOpen();
  };

  return (
    <>
      <Card className="w-full">
        <Tabs
          aria-label="로그 보기 모드"
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
          className="px-4 pt-2"
        >
          <Tab
            key="list"
            title={
              <div className="flex items-center">
                <List size={16} className="mr-1" />
                목록 보기
              </div>
            }
          />
          <Tab
            key="analytics"
            title={
              <div className="flex items-center">
                <BarChart2 size={16} className="mr-1" />
                분석 보기
              </div>
            }
          />
          <Tab
            key="realtime"
            title={
              <div className="flex items-center">
                <Clock size={16} className="mr-1" />
                실시간 모니터링
              </div>
            }
          />
        </Tabs>

        <CardBody className="p-4">
          {/* 목록 탭 */}
          {activeTab === "list" && (
            <LogTable
              logs={logs}
              isLoading={isLoading}
              totalCount={totalCount}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={onPageChange}
              onSelectLog={handleSelectLog}
            />
          )}

          {/* 분석 탭 */}
          {activeTab === "analytics" && (
            <LogAnalytics logs={logs} isLoading={isLoading} />
          )}

          {/* 실시간 탭 */}
          {activeTab === "realtime" && (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <AlertTriangle size={48} className="text-orange-400 mb-4" />
              <h3 className="text-xl font-medium mb-2">실시간 모니터링</h3>
              <p className="text-center text-gray-500 max-w-md">
                실시간 로그 모니터링 기능은 곧 제공될 예정입니다. 지금은 '목록
                보기'와 '분석 보기' 탭을 이용해주세요.
              </p>
            </div>
          )}

          {/* 빈 상태 */}
          {logs.length === 0 && !isLoading && activeTab !== "realtime" && (
            <div className="text-center py-12 text-gray-500">
              <AlertTriangle size={32} className="mx-auto mb-2" />
              <p>표시할 로그 데이터가 없습니다.</p>
              <p className="text-sm mt-2">
                필터를 조정하거나 다른 시간 범위를 선택해 보세요.
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 로그 상세 정보 서랍 */}
      <Drawer
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="xl"
        placement="right"
      >
        <DrawerContent>
          <DrawerHeader className="flex justify-between items-center">
            <h3 className="text-lg font-medium">로그 상세</h3>
            <Button variant="light" isIconOnly onPress={onClose}>
              <X size={18} />
            </Button>
          </DrawerHeader>
          <DrawerBody>
            {selectedLog && (
              <LogDetail
                log={selectedLog}
                onBack={onClose}
                onViewTrace={onViewTrace}
              />
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default LogVisualization;
