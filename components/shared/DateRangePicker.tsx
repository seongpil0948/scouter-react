import React, { useEffect, useState, useCallback, useRef } from "react";
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
  isDisabled?: boolean;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  onChange,
  isDisabled = false,
}) => {
  const { timeRange, setTimeRange, isRealtime } = useFilterStore();
  const [value, setValue] = useState<RangeValue<CalendarDateTime> | null>(null);

  // 내부 상태 업데이트 플래그 - ref로 관리하여 렌더링 영향 없이 상태 추적
  const isInternalUpdateRef = useRef(false);
  const isComponentMountedRef = useRef(false);
  const prevTimeRangeRef = useRef({ startTime: 0, endTime: 0 });

  // timestamp를 CalendarDateTime으로 안전하게 변환하는 함수
  const convertToCalendarDateTime = useCallback((timestamp: number) => {
    try {
      if (!timestamp || timestamp <= 0) {
        return null;
      }

      const date = new Date(timestamp);
      // ISO 포맷으로 변환 후 파싱 - 더 안정적인 방식
      const isoString = date.toISOString();
      return parseDateTime(isoString);
    } catch (error) {
      console.error(
        `[DateRangePicker] Error converting timestamp ${timestamp}:`,
        error
      );
      return null;
    }
  }, []);

  // 두 타임스탬프를 비교하여 실질적인 변화가 있는지 확인
  const hasTimeRangeChanged = useCallback(
    (oldStart: number, oldEnd: number, newStart: number, newEnd: number) => {
      // 둘 다 유효한 값이 아니면 변화 없음으로 간주
      if ((oldStart <= 0 && newStart <= 0) || (oldEnd <= 0 && newEnd <= 0)) {
        return false;
      }

      // 둘 중 하나라도 유효하지 않으면 변화 있음으로 간주
      if (oldStart <= 0 || oldEnd <= 0 || newStart <= 0 || newEnd <= 0) {
        return true;
      }

      // 실질적인 차이가 1초 이상인 경우만 변화로 간주
      const startDiff = Math.abs(oldStart - newStart);
      const endDiff = Math.abs(oldEnd - newEnd);

      return startDiff > 1000 || endDiff > 1000;
    },
    []
  );

  // timeRange를 UI에 반영하는 함수
  const updateUIFromTimeRange = useCallback(() => {
    // 이미 내부 업데이트 중이면 무시
    if (isInternalUpdateRef.current) return;

    try {
      isInternalUpdateRef.current = true;

      const { startTime, endTime } = timeRange;

      if (startTime <= 0 || endTime <= 0) {
        console.log("[DateRangePicker] Invalid timeRange, skipping UI update");
        setValue(null);
        return;
      }

      // 이전 값과 변화가 없으면 업데이트 건너뛰기
      if (
        !hasTimeRangeChanged(
          prevTimeRangeRef.current.startTime,
          prevTimeRangeRef.current.endTime,
          startTime,
          endTime
        )
      ) {
        console.log(
          "[DateRangePicker] No significant change in timeRange, skipping UI update"
        );
        return;
      }

      console.log(
        "[DateRangePicker] Updating UI with timeRange:",
        new Date(startTime).toLocaleString(),
        new Date(endTime).toLocaleString()
      );

      const startDateTime = convertToCalendarDateTime(startTime);
      const endDateTime = convertToCalendarDateTime(endTime);

      if (startDateTime && endDateTime) {
        setValue({
          start: startDateTime,
          end: endDateTime,
        });

        // 이전 값 저장
        prevTimeRangeRef.current = { startTime, endTime };
      } else {
        console.warn(
          "[DateRangePicker] Failed to convert timestamps to CalendarDateTime"
        );
      }
    } catch (error) {
      console.error(
        "[DateRangePicker] Error updating UI from timeRange:",
        error
      );
    } finally {
      // 내부 업데이트 플래그 해제
      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 0);
    }
  }, [timeRange, hasTimeRangeChanged, convertToCalendarDateTime]);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    isComponentMountedRef.current = true;

    // 컴포넌트 마운트 시 timeRange가 유효하면 UI에 반영
    if (timeRange.startTime > 0 && timeRange.endTime > 0) {
      console.log(
        "[DateRangePicker] Component mounted, using existing timeRange:",
        new Date(timeRange.startTime).toLocaleString(),
        new Date(timeRange.endTime).toLocaleString()
      );
      updateUIFromTimeRange();
    } else {
      // timeRange가 유효하지 않으면 기본값 설정
      const now = Date.now();
      const oneHourAgo = now - 3600000;

      console.log(
        "[DateRangePicker] Component mounted, setting default timeRange:",
        new Date(oneHourAgo).toLocaleString(),
        new Date(now).toLocaleString()
      );

      // 기본값 설정
      setTimeRange(oneHourAgo, now);
      prevTimeRangeRef.current = { startTime: oneHourAgo, endTime: now };

      // UI에도 직접 반영
      const startDateTime = convertToCalendarDateTime(oneHourAgo);
      const endDateTime = convertToCalendarDateTime(now);

      if (startDateTime && endDateTime) {
        setValue({
          start: startDateTime,
          end: endDateTime,
        });
      }
    }

    return () => {
      isComponentMountedRef.current = false;
    };
  }, [
    updateUIFromTimeRange,
    setTimeRange,
    timeRange,
    convertToCalendarDateTime,
  ]);

  // timeRange 변경 감지하여 UI 업데이트
  useEffect(() => {
    // 컴포넌트가 마운트되지 않았거나 내부 업데이트 중이면 무시
    if (!isComponentMountedRef.current || isInternalUpdateRef.current) return;

    // 현재 타임스탬프와 저장된 타임스탬프가 다르면 UI 업데이트
    if (
      timeRange.startTime !== prevTimeRangeRef.current.startTime ||
      timeRange.endTime !== prevTimeRangeRef.current.endTime
    ) {
      updateUIFromTimeRange();
    }
  }, [timeRange, updateUIFromTimeRange]);

  // 사용자가 날짜 선택 시 호출되는 핸들러
  const handleValueChange = useCallback(
    (newValue: RangeValue<CalendarDateTime> | null) => {
      // 유효한 값이 아니거나 내부 업데이트 중이면 무시
      if (!newValue?.start || !newValue?.end || isInternalUpdateRef.current) {
        return;
      }

      try {
        isInternalUpdateRef.current = true;

        // UI 상태 업데이트
        setValue(newValue);

        // CalendarDateTime을 타임스탬프로 변환
        const startTime = newValue.start.toDate(getLocalTimeZone()).getTime();
        const endTime = newValue.end.toDate(getLocalTimeZone()).getTime();

        console.log(
          "[DateRangePicker] User selected date range:",
          new Date(startTime).toLocaleString(),
          new Date(endTime).toLocaleString()
        );

        // 변경 사항이 있을 때만 후속 작업 수행
        if (
          hasTimeRangeChanged(
            timeRange.startTime,
            timeRange.endTime,
            startTime,
            endTime
          )
        ) {
          // 스토어 상태 업데이트
          setTimeRange(startTime, endTime);
          prevTimeRangeRef.current = { startTime, endTime };

          // 부모 컴포넌트에 변경 알림
          if (onChange) {
            onChange(startTime, endTime);
          }
        }
      } catch (error) {
        console.error(
          "[DateRangePicker] Error handling date selection:",
          error
        );
      } finally {
        // 내부 업데이트 플래그 해제
        setTimeout(() => {
          isInternalUpdateRef.current = false;
        }, 10);
      }
    },
    [timeRange, setTimeRange, onChange, hasTimeRangeChanged]
  );

  return (
    <div className="flex items-center gap-2 w-full max-w-xl">
      <HeroDateRangePicker
        label="데이터 조회 기간"
        value={value}
        onChange={handleValueChange}
        granularity="minute"
        isDisabled={isRealtime || isDisabled}
        aria-label="데이터 조회 기간 선택"
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
