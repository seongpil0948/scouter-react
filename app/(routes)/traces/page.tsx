'use client';

import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';

import { useFilterStore } from '@/lib/store/telemetryStore';
import { useTraceFilterStore } from '@/lib/store/traceFilterStore';
import DateRangePicker from '@/components/shared/DateRangePicker';
import { ThemeSwitch } from '@/components/shared/theme-switch';
import TraceFilter from '@/components/traces/TraceFilter';
import { buildTraceApiUrl } from '@/lib/utils/filterUtils';
import { Card, CardBody } from '@heroui/card';
import TraceTable from '@/components/traces/TraceTable';

// API 호출을 위한 fetcher 함수
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TracesPage() {
  const router = useRouter();
  const { timeRange } = useFilterStore();
  const {
    searchQuery,
    limit,
    selectedServices,
    selectedStatuses,
    minDuration,
    maxDuration,
    sortField,
    sortDirection,
    lastRefreshed,
    rootSpansOnly, // 루트 스팬만 조회 옵션 사용
  } = useTraceFilterStore();

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);

  // 페이지 변경 시 offset 계산
  const offset = (currentPage - 1) * limit;

  // API URL 생성 (rootSpansOnly 추가)
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
    offset,
    { rootSpansOnly } // 루트 스팬만 조회 여부 전달
  );
  const { data, error, mutate } = useSWR<TracesResponse>(
    [apiUrl, lastRefreshed], // lastRefreshed를 의존성에 추가하여 필터 변경 시 재요청
    () => fetcher(apiUrl),
    {
      refreshInterval: 0, // 자동 갱신 비활성화 (필터 변경 시만 갱신)
      revalidateOnFocus: false,
      dedupingInterval: 1000,
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
          totalCount={data?.total || 0}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onSelectTrace={handleTraceClick}
          pageSize={limit}
        />

        {/* 표시 정보 */}
        {data && (
          <div className="text-sm text-gray-500 text-right">
            총 {data.total}개의 트레이스 중 {data.traces.length}개 표시 중
            {data.rootSpansOnly && <span className="ml-2">(루트 스팬만 표시)</span>}
          </div>
        )}
      </div>
    </section>
  );
}
