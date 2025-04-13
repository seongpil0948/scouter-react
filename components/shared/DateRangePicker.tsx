'use client';
import React, { useEffect, useState } from 'react';
import { DateRangePicker as HeroDateRangePicker } from '@heroui/date-picker';
import { Button } from '@heroui/button';
import { Clock } from 'lucide-react';
import { parseDateTime, getLocalTimeZone, CalendarDateTime, today, now } from '@internationalized/date';
import { RangeValue } from '@react-types/shared';

import { useFilterStore } from '@/lib/store/telemetryStore';

interface DateRangePickerProps {
  onChange?: (startTime: number, endTime: number) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ onChange }) => {
  const { timeRange, setTimeRange } = useFilterStore();

  // Initialize with timeRange values converted to CalendarDateTime to include time
  const [value, setValue] = useState(() => {
    // Parse timestamps to date objects
    const startDate = new Date(timeRange.startTime);
    const endDate = new Date(timeRange.endTime);

    // Format as ISO strings with time component
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    // Create CalendarDateTime objects
    return {
      start: parseDateTime(startISO.slice(0, 19)), // Remove timezone part
      end: parseDateTime(endISO.slice(0, 19)),
    };
  });

  // Convert date changes to timestamps and update store
  const handleValueChange = (newValue: RangeValue<CalendarDateTime> | null) => {
    if (!newValue) return;
    setValue(newValue);

    if (newValue && newValue.start && newValue.end) {
      const startTime = newValue.start.toDate(getLocalTimeZone()).getTime();
      const endTime = newValue.end.toDate(getLocalTimeZone()).getTime();

      setTimeRange(startTime, endTime);
      onChange?.(startTime, endTime);
    }
  };

  const handleRefresh = () => {
    const now = Date.now();
    const duration = timeRange.endTime - timeRange.startTime;
    const newStartTime = now - duration;

    // Create new CalendarDateTime objects
    const startDate = new Date(newStartTime);
    const endDate = new Date(now);

    const newValue = {
      start: parseDateTime(startDate.toISOString().slice(0, 19)),
      end: parseDateTime(endDate.toISOString().slice(0, 19)),
    };

    setValue(newValue);
    setTimeRange(newStartTime, now);
    onChange?.(newStartTime, now);
  };

  useEffect(handleRefresh, []);

  return (
    <div className="flex items-center gap-2 w-full max-w-xl">
      <HeroDateRangePicker
        label="데이터 조회 기간"
        value={value}
        onChange={handleValueChange}
        granularity="minute" // 시간과 분까지 선택 가능하도록 설정
      />
    </div>
  );
};

export default DateRangePicker;
