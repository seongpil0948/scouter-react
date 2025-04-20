"use client";
import React, { useEffect, useState, useCallback } from "react";
import { DateRangePicker as HeroDateRangePicker } from "@heroui/date-picker";
import { Clock } from "lucide-react";
import {
  parseDateTime,
  getLocalTimeZone,
  CalendarDateTime,
} from "@internationalized/date";
import { RangeValue } from "@react-types/shared";

import { useFilterStore } from "@/lib/store/telemetryStore";
import { Chip } from "@heroui/chip";

interface DateRangePickerProps {
  onChange?: (startTime: number, endTime: number) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ onChange }) => {
  const { timeRange, setTimeRange, isRealtime } = useFilterStore();

  // Initialize with timeRange values converted to CalendarDateTime to include time
  const [value, setValue] = useState<RangeValue<CalendarDateTime> | null>(null);

  // 컴포넌트 마운트 시 초기화 - 의존성 배열 수정
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
    // 컴포넌트가 처음 마운트될 때만 실행되도록 빈 배열로 설정
    // 참고: 기존 코드에서 updateValueFromTimeRange와 setTimeRange가 의존성 배열에 없지만
    // 의도적으로 최초 한 번만 실행하기 위해 설계된 것으로 보임
  }, []);

  // timeRange가 변경되었을 때 value 업데이트
  useEffect(() => {
    if (timeRange.startTime && timeRange.endTime) {
      updateValueFromTimeRange(timeRange.startTime, timeRange.endTime);
    }
  }, [timeRange]);

  // timestamp를 CalendarDateTime으로 변환하는 함수
  const updateValueFromTimeRange = useCallback(
    (startTime: number, endTime: number) => {
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
        console.error("날짜 변환 오류:", error);
      }
    },
    []
  );

  // 날짜 범위 변경 핸들러 - 디바운스 추가
  const [isChangingRange, setIsChangingRange] = useState(false);

  const handleValueChange = useCallback(
    (newValue: RangeValue<CalendarDateTime> | null) => {
      if (!newValue?.start || !newValue?.end) return;
      if (isChangingRange) return; // 연속 변경 방지

      setIsChangingRange(true);
      setValue(newValue);

      const startTime = newValue.start.toDate(getLocalTimeZone()).getTime();
      const endTime = newValue.end.toDate(getLocalTimeZone()).getTime();

      // 현재 timeRange와 다를 때만 업데이트
      if (timeRange.startTime !== startTime || timeRange.endTime !== endTime) {
        setTimeRange(startTime, endTime);
        onChange?.(startTime, endTime);
      }

      // 변경 후 약간의 시간을 둬서 연속 호출 방지
      setTimeout(() => setIsChangingRange(false), 500);
    },
    [onChange, setTimeRange, timeRange, isChangingRange]
  );

  return (
    <div className="flex items-center gap-2 w-full max-w-xl">
      <HeroDateRangePicker
        label="데이터 조회 기간"
        value={value}
        onChange={handleValueChange}
        granularity="minute" // 시간과 분까지 선택 가능하도록 설정
        isDisabled={isRealtime} // 실시간 모드일 때는 비활성화
      />

      {isRealtime && (
        <Chip
          size="lg"
          color="primary"
          startContent={<Clock size={14} />}
          variant="faded"
        >
          실시간
        </Chip>
      )}
    </div>
  );
};

export default DateRangePicker;
