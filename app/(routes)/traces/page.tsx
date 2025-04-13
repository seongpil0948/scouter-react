'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';

import DateRangePicker from '@/components/shared/DateRangePicker';
import { ThemeSwitch } from '@/components/shared/theme-switch';
import TraceFilter from '@/components/traces/TraceFilter';
import { Card, CardBody } from '@heroui/card';
import TraceTable from '@/components/traces/TraceTable';
import { useTraceData } from '@/lib/hooks/useTraceData'; // 새로운 커스텀 훅 사용

export default function TracesPage() {
  const router = useRouter();

  // useTraceData 커스텀 훅 사용
  const { traces, error, isLoading, isValidating, refresh, isRealtime, toggleRealtime, currentPage, setCurrentPage, totalCount } =
    useTraceData({
      refreshInterval: 5000,
      rootSpansOnly: true,
    });

  // 트레이스 클릭 핸들러
  const handleTraceClick = useCallback(
    (trace: TraceItem) => {
      router.push(`/traces/${trace.traceId}`);
    },
    [router]
  );

  // 시간 범위 변경 핸들러
  const handleTimeRangeChange = useCallback(() => {
    // 시간 범위가 변경되면 실시간 모드 비활성화
    if (isRealtime) {
      toggleRealtime(false);
    }
    refresh();
  }, [refresh, isRealtime, toggleRealtime]);

  // 필터 변경 핸들러
  const handleFilterChange = useCallback(() => {
    refresh();
  }, [refresh]);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <h1 className="text-2xl font-bold">트레이스 목록</h1>
        <p className="text-gray-500 text-sm mt-1">분산 트레이스 데이터를 시간, 서비스, 상태 등으로 필터링하여 조회할 수 있습니다.</p>
      </div>

      <ThemeSwitch className="absolute top-4 right-4" />

      <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-7xl">
        <DateRangePicker onChange={handleTimeRangeChange} isRealtime={isRealtime} />
      </div>

      <div className="w-full max-w-7xl space-y-4">
        {/* 필터 컴포넌트 */}
        <TraceFilter onFilterChange={handleFilterChange} isRealtime={isRealtime} onToggleRealtime={toggleRealtime} />

        {/* 오류 상태 */}
        {error && (
          <Card>
            <CardBody className="p-8 text-center text-red-500">
              <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
              <p className="text-sm text-gray-500 mt-2">{error.message}</p>
            </CardBody>
          </Card>
        )}

        {/* 테이블 컴포넌트 */}
        <TraceTable
          traces={traces}
          isLoading={isLoading}
          totalCount={totalCount}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onSelectTrace={handleTraceClick}
          pageSize={100}
        />

        {/* 표시 정보 */}
        <div className="text-sm text-gray-500 text-right">
          총 {totalCount}개의 트레이스 중 {traces.length}개 표시 중
          {isRealtime && <span className="ml-2 text-blue-500">(실시간 갱신 중)</span>}
        </div>
      </div>
    </section>
  );
}
