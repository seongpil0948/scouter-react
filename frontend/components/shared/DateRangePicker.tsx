"use client";
import React, { useState } from "react";
import { DateRangePicker as HeroDateRangePicker } from "@heroui/date-picker";
import { Button } from "@heroui/button";
import { Clock } from "lucide-react";
import {
  parseDate,
  getLocalTimeZone,
  CalendarDate,
  today,
} from "@internationalized/date";
import { RangeValue } from "@react-types/shared";

import { useFilterStore } from "@/lib/store/telemetryStore";

interface DateRangePickerProps {
  onChange?: (startTime: number, endTime: number) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ onChange }) => {
  const { timeRange, setTimeRange } = useFilterStore();

  // Initialize with timeRange values converted to CalendarDate
  const [value, setValue] = useState<RangeValue<CalendarDate>>({
    start: parseDate(new Date(timeRange.startTime).toISOString().split("T")[0]),
    end: parseDate(new Date(timeRange.endTime).toISOString().split("T")[0]),
  });

  // Convert date changes to timestamps and update store
  const handleValueChange = (newValue: RangeValue<CalendarDate> | null) => {
    if (!newValue) return;
    setValue(newValue);

    if (newValue && newValue.start && newValue.end) {
      const startTime = newValue.start.toDate(getLocalTimeZone()).getTime();
      const endTime = newValue.end.toDate(getLocalTimeZone()).getTime();

      setTimeRange(startTime, endTime);
      onChange?.(startTime, endTime);
    }
  };

  // 새로고침 핸들러
  const handleRefresh = () => {
    const now = Date.now();
    const duration = timeRange.endTime - timeRange.startTime;
    const newStartTime = now - duration;

    const newStartDate = parseDate(
      new Date(newStartTime).toISOString().split("T")[0],
    );
    const newEndDate = parseDate(new Date(now).toISOString().split("T")[0]);

    const newValue = {
      start: newStartDate,
      end: newEndDate,
    };

    setValue(newValue);
    setTimeRange(newStartTime, now);
    onChange?.(newStartTime, now);
  };

  // Define quick selection options
  const handleQuickSelect = (daysBack: number) => {
    const endDate = today(getLocalTimeZone());
    const startDate =
      daysBack === 0 ? endDate : endDate.subtract({ days: daysBack });

    const newValue = { start: startDate, end: endDate };

    setValue(newValue);

    const startTime = startDate.toDate(getLocalTimeZone()).getTime();
    const endTime = endDate.toDate(getLocalTimeZone()).getTime();

    setTimeRange(startTime, endTime);
    onChange?.(startTime, endTime);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 max-w-md">
        <HeroDateRangePicker
          label="데이터 조회 기간"
          value={value}
          onChange={handleValueChange}
        />

        <div className="flex gap-1 text-xs">
          <Button
            size="sm"
            variant="ghost"
            onPress={() => handleQuickSelect(0)}
          >
            오늘
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => handleQuickSelect(1)}
          >
            어제
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => handleQuickSelect(7)}
          >
            7일
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => handleQuickSelect(30)}
          >
            30일
          </Button>
        </div>
      </div>

      <Button
        className="flex items-center gap-1"
        color="primary"
        title="새로고침"
        variant="ghost"
        onPress={handleRefresh}
      >
        <Clock size={16} />
        <span className="hidden md:inline">새로고침</span>
      </Button>
    </div>
  );
};

export default DateRangePicker;
