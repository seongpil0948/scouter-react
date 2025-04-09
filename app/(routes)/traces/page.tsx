'use client';

import { useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { ThemeSwitch } from '@/components/shared/theme-switch';
import TraceFilter from '@/components/traces/TraceFilter';
import TraceTable from '@/components/traces/TraceTable';
import DateRangePicker from '@/components/shared/DateRangePicker';
import { useFilterStore } from '@/lib/store/telemetryStore';
import { useTraceFilterStore, LimitOption } from '@/lib/store/traceFilterStore';
import { buildTraceApiUrl } from '@/lib/utils/filterUtils';
import { Card, CardBody } from '@heroui/card';

// API 호출을 위한 fetcher 함수
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TracesPage() {
  const router = useRouter();
  const { timeRange } = useFilterStore();
  const { searchQuery, limit, selectedServices, selectedStatuses, minDuration, maxDuration, sortField, sortDirection, lastRefreshed } =
    useTraceFilterStore();

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);

  // 페이지 변경 시 offset 계산
  const offset = (currentPage - 1) * limit;

  // API URL 생성
  const apiUrl = buildTraceApiUrl(
    '/api/telemetry/traces',
    {
      searchQuery,
      selectedServices,
      selectedStatuses,
      minDuration,
      maxDuration,
    },
    timeRange,
    limit,
    sortField,
    sortDirection,
    offset
  );

  // SWR로 데이터 가져오기
  const { data, error, isLoading, mutate } = useSWR(
    // 새로고침, 페이지 변경, 필터 변경 시 재요청을 위한 의존성 배열
    [apiUrl, lastRefreshed, currentPage],
    () => fetcher(apiUrl),
    {
      dedupingInterval: 2000,
      revalidateOnFocus: false,
    }
  );

  // 트레이스 클릭 핸들러
  const handleTraceClick = useCallback(
    (trace: TraceItem) => {
      router.push(`/traces/${trace.traceId}`);
    },
    [router]
  );

  // 필터 변경 핸들러
  const handleFilterChange = useCallback(() => {
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
    mutate(); // 데이터 재요청
  }, [mutate]);

  // 시간 범위 변경 핸들러
  const handleTimeRangeChange = useCallback(() => {
    setCurrentPage(1); // 시간 범위 변경 시 첫 페이지로 이동
    mutate(); // 데이터 재요청
  }, [mutate]);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <h1 className="text-2xl font-bold">트레이스 목록</h1>
        <p className="text-gray-500 text-sm mt-1">분산 트레이스 데이터를 시간, 서비스, 상태 등으로 필터링하여 조회할 수 있습니다.</p>
      </div>

      <ThemeSwitch className="absolute top-4 right-4" />

      <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-7xl">
        <DateRangePicker onChange={handleTimeRangeChange} />
      </div>

      <div className="w-full max-w-7xl space-y-4">
        {/* 필터 컴포넌트 */}
        <TraceFilter onFilterChange={handleFilterChange} />

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
          traces={data?.traces || []}
          isLoading={isLoading}
          totalCount={data?.total || 0}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onSelectTrace={handleTraceClick}
          pageSize={limit}
        />
      </div>
    </section>
  );
}
