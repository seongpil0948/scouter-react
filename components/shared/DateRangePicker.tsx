'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { DateRangePicker as HeroDateRangePicker } from '@heroui/date-picker';
import { Button } from '@heroui/button';
import { Clock, RefreshCw } from 'lucide-react';
import { parseDateTime, getLocalTimeZone, CalendarDateTime, today, now } from '@internationalized/date';
import { RangeValue } from '@react-types/shared';

import { useFilterStore } from '@/lib/store/telemetryStore';

interface DateRangePickerProps {
  onChange?: (startTime: number, endTime: number) => void;
  isRealtime?: boolean;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ onChange, isRealtime }) => {
  const { timeRange, setTimeRange } = useFilterStore();

  // Initialize with timeRange values converted to CalendarDateTime to include time
  const [value, setValue] = useState<RangeValue<CalendarDateTime> | null>(null);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    // 시간 범위가 있으면 해당 값으로, 없으면 기본값으로 설정
    if (timeRange.startTime && timeRange.endTime) {
      updateValueFromTimeRange(timeRange.startTime, timeRange.endTime);
    } else {
      // 기본값: 지난 1시간
      const endTime = Date.now();
      const startTime = endTime - 3600000; // 1시간 전
      setTimeRange(startTime, endTime);
      updateValueFromTimeRange(startTime, endTime);
    }
  }, []);

  // timeRange가 변경되었을 때 value 업데이트
  useEffect(() => {
    if (timeRange.startTime && timeRange.endTime) {
      updateValueFromTimeRange(timeRange.startTime, timeRange.endTime);
    }
  }, [timeRange]);

  // timestamp를 CalendarDateTime으로 변환하는 함수
  const updateValueFromTimeRange = useCallback((startTime: number, endTime: number) => {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    // ISO 문자열로 변환 후 시간대 정보 제거
    const startISO = startDate.toISOString().slice(0, 19);
    const endISO = endDate.toISOString().slice(0, 19);

    try {
      setValue({
        start: parseDateTime(startISO),
        end: parseDateTime(endISO),
      });
    } catch (error) {
      console.error('날짜 변환 오류:', error);
    }
  }, []);

  // 날짜 범위 변경 핸들러
  const handleValueChange = useCallback(
    (newValue: RangeValue<CalendarDateTime> | null) => {
      if (!newValue?.start || !newValue?.end) return;

      setValue(newValue);

      const startTime = newValue.start.toDate(getLocalTimeZone()).getTime();
      const endTime = newValue.end.toDate(getLocalTimeZone()).getTime();

      setTimeRange(startTime, endTime);
      onChange?.(startTime, endTime);
    },
    [onChange, setTimeRange]
  );

  // 새로고침 핸들러 - 현재 시간 기준으로 같은 기간 다시 설정
  const handleRefresh = useCallback(() => {
    if (!value?.start || !value?.end) return;

    const duration = timeRange.endTime - timeRange.startTime;
    const now = Date.now();
    const newStartTime = now - duration;
    const newEndTime = now;

    setTimeRange(newStartTime, newEndTime);
    updateValueFromTimeRange(newStartTime, newEndTime);
    onChange?.(newStartTime, newEndTime);
  }, [timeRange, value, onChange, setTimeRange, updateValueFromTimeRange]);

  return (
    <div className="flex items-center gap-2 w-full max-w-xl">
      <HeroDateRangePicker
        label="데이터 조회 기간"
        value={value}
        onChange={handleValueChange}
        granularity="minute" // 시간과 분까지 선택 가능하도록 설정
        isDisabled={isRealtime} // 실시간 모드일 때는 비활성화
      />
      <Button
        size="sm"
        variant="ghost"
        color="default"
        title="새로고침"
        isDisabled={isRealtime} // 실시간 모드일 때는 비활성화
        onPress={handleRefresh}
      >
        <RefreshCw size={16} />
      </Button>

      {isRealtime && (
        <div className="flex items-center px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-600 dark:text-blue-300 text-sm">
          <Clock size={14} className="mr-1" />
          <span>실시간 모드</span>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
