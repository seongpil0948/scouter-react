'use client';

import React from 'react';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from '@heroui/table';
import { Badge } from '@heroui/badge';
import { Button } from '@heroui/button';
import { Share2, X, ArrowRight, Eye } from 'lucide-react';
import { addToast } from '@heroui/toast';
import { formatDateTime, formatDuration } from '@/lib/utils/dateFormatter';
import { SelectedTraceData } from './types';

interface SelectedTracesTableProps {
  selectedTraces: SelectedTraceData[];
  onClearSelection: () => void;
  onViewDetails?: (traceId: string) => void;
  className?: string;
}

const SelectedTracesTable: React.FC<SelectedTracesTableProps> = ({ selectedTraces, onClearSelection, onViewDetails, className = '' }) => {
  if (selectedTraces.length === 0) return null;

  // 상태에 따른 색상 결정
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ERROR':
        return 'danger';
      case 'OK':
        return 'success';
      default:
        return 'default';
    }
  };

  // 트레이스 ID 복사
  const copyTraceId = (traceId: string) => {
    navigator.clipboard
      .writeText(traceId)
      .then(() => {
        addToast({
          title: '복사 완료',
          description: '트레이스 ID가 클립보드에 복사되었습니다',
          color: 'success',
        });
      })
      .catch(() => {
        addToast({
          title: '복사 실패',
          description: '클립보드 접근에 실패했습니다',
          color: 'danger',
        });
      });
  };

  return (
    <div className={`mt-4 bg-white dark:bg-gray-800 rounded-lg shadow ${className}`} data-testid="selected-traces-table">
      <div className="p-3 bg-gray-50 dark:bg-gray-750 border-b flex justify-between items-center">
        <div className="flex items-center">
          <h3 className="text-base font-medium">선택된 트레이스 ({selectedTraces.length}개)</h3>
        </div>
        <Button size="sm" variant="ghost" color="danger" onPress={onClearSelection}>
          <X size={16} className="mr-1" />
          선택 해제
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table aria-label="선택된 트레이스 목록" isHeaderSticky removeWrapper isStriped selectionMode="none">
          <TableHeader>
            <TableColumn key="time">시간</TableColumn>
            <TableColumn key="service">서비스</TableColumn>
            <TableColumn key="name">이름</TableColumn>
            <TableColumn key="status">상태</TableColumn>
            <TableColumn key="duration">지연 시간</TableColumn>
            <TableColumn key="actions" align="center">
              작업
            </TableColumn>
          </TableHeader>
          <TableBody items={selectedTraces}>
            {(trace) => (
              <TableRow key={`${trace.traceId}-${trace.timestamp}`}>
                <TableCell>{formatDateTime(trace.timestamp)}</TableCell>
                <TableCell>
                  <Badge color="primary">{trace.serviceName}</Badge>
                </TableCell>
                <TableCell>
                  <div className="font-mono text-sm max-w-sm truncate" title={trace.name}>
                    {trace.name}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge color={getStatusColor(trace.status)}>{trace.status || 'UNSET'}</Badge>
                </TableCell>
                <TableCell>{formatDuration(trace.latency)}</TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Button isIconOnly size="sm" variant="light" title="트레이스 ID 복사" onPress={() => copyTraceId(trace.traceId)}>
                      <Share2 size={16} />
                    </Button>
                    {onViewDetails && (
                      <Button isIconOnly size="sm" variant="light" title="상세 보기" onPress={() => onViewDetails(trace.traceId)}>
                        <Eye size={16} />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SelectedTracesTable;
