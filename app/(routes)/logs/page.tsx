// app/(routes)/logs/page.tsx
"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerBody,
  DrawerHeader,
} from "@heroui/drawer";
import { X } from "lucide-react";
import { useDisclosure } from "@heroui/modal";
import { Button } from "@heroui/button";
import { ThemeSwitch } from "@/components/shared/theme-switch";
import DateRangePicker from "@/components/shared/DateRangePicker";
import { useFilterStore } from "@/lib/store/telemetryStore";
import { useLogData } from "@/lib/hooks/useLogData";
import LogFilter from "@/components/logs/LogFilter";
import LogTable from "@/components/logs/LogTable";
import LogDetail from "@/components/logs/LogDetail";

export default function LogsPage() {
  const router = useRouter();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { timeRange, setTimeRange, isRealtime, toggleRealtime } =
    useFilterStore();
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);

  // Use log data hook
  const {
    logs,
    isLoading,
    error,
    totalCount,
    currentPage,
    setCurrentPage,
    services,
    severities,
    filters,
    updateFilters,
    refresh,
  } = useLogData({
    autoRefresh: isRealtime,
  });

  // Handle time range change
  const handleTimeRangeChange = useCallback(
    (startTime: number, endTime: number) => {
      setTimeRange(startTime, endTime);
      refresh();
    },
    [setTimeRange, refresh]
  );

  // Handle filter change
  const handleFilterChange = useCallback(() => {
    refresh();
  }, [refresh]);

  // Handle log selection
  const handleLogSelect = useCallback(
    (log: LogItem) => {
      setSelectedLog(log);
      onOpen();
    },
    [onOpen]
  );

  // Handle view trace
  const handleViewTrace = useCallback(
    (traceId: string) => {
      onClose();
      router.push(`/traces/${traceId}`);
    },
    [onClose, router]
  );

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-lg text-center justify-center">
        <h1 className="text-2xl font-bold">Logs</h1>
        <p className="text-gray-500 mt-2">
          View and search logs across services
        </p>
      </div>

      <ThemeSwitch className="absolute top-4 right-4" />

      <div className="w-full max-w-7xl">
        <div className="flex justify-between items-center mb-4">
          <DateRangePicker
            onChange={handleTimeRangeChange}
            isDisabled={isRealtime}
          />
        </div>

        <LogFilter
          services={services}
          severities={severities}
          filters={filters}
          updateFilters={updateFilters}
          onFilterChange={handleFilterChange}
          onRefresh={refresh}
          isRealtime={isRealtime}
          onToggleRealtime={toggleRealtime}
        />

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
            <p className="font-medium">Error loading logs</p>
            <p className="text-sm mt-1">{error.message}</p>
            <Button
              color="primary"
              variant="light"
              className="mt-2"
              onPress={() => refresh()}
            >
              Try again
            </Button>
          </div>
        )}

        <LogTable
          logs={logs}
          isLoading={isLoading}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={filters.limit}
          onPageChange={setCurrentPage}
          onSelectLog={handleLogSelect}
        />

        <div className="mt-4 text-sm text-gray-500 text-right">
          Showing {logs.length} of {totalCount} logs
          {isRealtime && (
            <span className="ml-2 text-blue-500">
              (Realtime updates enabled)
            </span>
          )}
        </div>
      </div>

      {/* Log detail drawer */}
      <Drawer
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="xl"
        placement="right"
      >
        <DrawerContent>
          {() => (
            <>
              <DrawerHeader className="flex justify-between items-center">
                <div className="flex items-center">
                  <Button
                    variant="light"
                    isIconOnly
                    onPress={onClose}
                    className="mr-2"
                  >
                    <X size={18} />
                  </Button>
                  <h2 className="text-xl">Log Detail</h2>
                </div>
              </DrawerHeader>
              <DrawerBody>
                {selectedLog && (
                  <LogDetail
                    log={selectedLog}
                    onBack={onClose}
                    onViewTrace={handleViewTrace}
                  />
                )}
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </section>
  );
}
