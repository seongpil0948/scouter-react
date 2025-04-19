'use client';

import React, { useCallback } from 'react';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from '@heroui/table';
import { Badge } from '@heroui/badge';
import { Button } from '@heroui/button';
import { Pagination } from '@heroui/pagination';
import { Tooltip } from '@heroui/tooltip';
import { Eye as EyeIcon, Clock, Share2, AlertTriangle, Check, HelpCircle } from 'lucide-react';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';

import { formatDateTime, formatDuration, formatRelativeTime } from '@/lib/utils/dateFormatter';

interface TraceTableProps {
  traces: TraceItem[];
  isLoading?: boolean;
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSelectTrace: (trace: TraceItem) => void;
  pageSize: number;
}

const TraceTable: React.FC<TraceTableProps> = ({
  traces,
  isLoading = false,
  totalCount,
  currentPage,
  onPageChange,
  onSelectTrace,
  pageSize,
}) => {
  // 상태에 따른 색상 결정
  const getStatusColor = useCallback((status?: string) => {
    switch (status) {
      case 'ERROR':
        return 'danger';
      case 'OK':
        return 'success';
      default:
        return 'default';
    }
  }, []);

  // 상태 아이콘 렌더링
  const renderStatusIcon = useCallback((status?: string) => {
    switch (status) {
      case 'ERROR':
        return <AlertTriangle className="mr-1" size={14} />;
      case 'OK':
        return <Check className="mr-1" size={14} />;
      default:
        return <HelpCircle className="mr-1" size={14} />;
    }
  }, []);

  // 트레이스 이름 렌더링
  const renderName = useCallback((trace: TraceItem) => {
    // 이름이 너무 길면 잘라서 표시
    const name = trace.name || 'Unknown';
    const shortName = name.length > 40 ? `${name.substring(0, 40)}...` : name;

    return (
      <Tooltip content={name}>
        <div className="font-mono text-sm cursor-help">{shortName}</div>
      </Tooltip>
    );
  }, []);

  // 속성 렌더링
  const renderAttributes = useCallback((trace: TraceItem) => {
    if (!trace.attributes) return null;

    // 중요 속성 추출
    const importantAttrs = ['http.method', 'http.url', 'http.status_code', 'db.operation', 'error.message'];
    const attrEntries = Object.entries(trace.attributes)
      .filter(([key]) => importantAttrs.includes(key))
      .slice(0, 2); // 최대 2개만 표시

    if (attrEntries.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {attrEntries.map(([key, value]) => (
          <Chip key={key} size="sm" variant="flat" color={key.includes('error') ? 'danger' : 'default'} className="text-xs">
            {key.split('.').pop()}: {String(value).substring(0, 20)}
            {String(value).length > 20 ? '...' : ''}
          </Chip>
        ))}
        {Object.keys(trace.attributes).length > 2 && (
          <Chip size="sm" variant="flat" className="text-xs">
            +{Object.keys(trace.attributes).length - 2}
          </Chip>
        )}
      </div>
    );
  }, []);

  // 총 페이지 수 계산
  const pageCount = Math.ceil(totalCount / pageSize);

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <Table
        aria-label="트레이스 목록"
        isHeaderSticky
        removeWrapper
        classNames={{
          base: 'max-w-full',
          th: ['bg-default-100', 'text-default-800', 'border-b', 'border-divider', 'px-4', 'py-3', 'text-sm'],
          td: ['first:group-data-[first=true]:before:rounded-none', 'last:group-data-[first=true]:before:rounded-none', 'p-4', 'text-sm'],
        }}
        bottomContent={
          pageCount > 1 ? (
            <div className="flex justify-center py-4">
              <Pagination showControls showShadow color="primary" page={currentPage} total={pageCount} onChange={onPageChange} />
            </div>
          ) : null
        }
      >
        <TableHeader>
          <TableColumn key="time">시간</TableColumn>
          <TableColumn key="service">서비스</TableColumn>
          <TableColumn key="name" className="w-4/12">
            이름
          </TableColumn>
          <TableColumn key="status">상태</TableColumn>
          <TableColumn key="duration">지연 시간</TableColumn>
          <TableColumn key="actions" align="center">
            상세
          </TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={
            <div className="py-8 text-center text-gray-500">{isLoading ? '데이터를 로딩 중입니다...' : '트레이스 데이터가 없습니다.'}</div>
          }
          items={traces}
          isLoading={isLoading}
          loadingContent={<Spinner />}
        >
          {(trace) => (
            <TableRow key={trace.id} className="cursor-pointer hover:bg-gray-50">
              <TableCell>
                <div className="flex flex-col">
                  <span>{formatDateTime(trace.startTime)}</span>
                  <span className="text-xs text-gray-500">{formatRelativeTime(trace.startTime)}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge color="primary" variant="flat">
                  {trace.serviceName}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  {renderName(trace)}
                  {renderAttributes(trace)}
                </div>
              </TableCell>
              <TableCell>
                <Badge color={getStatusColor(trace.status)} className="flex items-center">
                  {renderStatusIcon(trace.status)}
                  {trace.status || 'UNSET'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Clock className="mr-1 text-gray-500" size={14} />
                  <span title={`${trace.duration}ms`}>{formatDuration(trace.duration)}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-center gap-2">
                  <Tooltip content="상세 보기">
                    <Button isIconOnly size="sm" variant="light" onPress={() => onSelectTrace(trace)}>
                      <EyeIcon size={16} />
                    </Button>
                  </Tooltip>
                  <Tooltip content="트레이스 ID 복사">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => {
                        navigator.clipboard.writeText(trace.traceId);
                      }}
                    >
                      <Share2 size={16} />
                    </Button>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TraceTable;
