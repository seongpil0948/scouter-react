// components/shared/DateRangePicker.tsx
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

  // 내부 상태 추적을 위한 플래그
  const [isInternalUpdate, setIsInternalUpdate] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const prevTimeRangeRef = useRef({ startTime: 0, endTime: 0 });

  // timestamp를 CalendarDateTime으로 변환하는 함수
  const updateValueFromTimeRange = useCallback(
    (startTime: number, endTime: number) => {
      if (!startTime || !endTime || startTime <= 0 || endTime <= 0) {
        console.log("[DateRangePicker] 유효하지 않은 시간 범위:", {
          startTime,
          endTime,
        });
        return;
      }

      try {
        // 내부 업데이트 플래그 설정
        setIsInternalUpdate(true);

        const startDate = new Date(startTime);
        const endDate = new Date(endTime);

        // ISO 문자열로 변환 후 시간 부분만 추출
        const startISO = startDate.toISOString().slice(0, 19);
        const endISO = endDate.toISOString().slice(0, 19);

        console.log(
          `[DateRangePicker] 시간 범위 변환: ${startTime} -> ${startISO}, ${endTime} -> ${endISO}`
        );

        const newValue = {
          start: parseDateTime(startISO),
          end: parseDateTime(endISO),
        };

        setValue(newValue);

        // 이전 값 저장
        prevTimeRangeRef.current = { startTime, endTime };

        // 내부 업데이트 플래그 해제 (비동기로 처리하여 렌더링 사이클 보장)
        setTimeout(() => {
          setIsInternalUpdate(false);
        }, 0);
      } catch (error) {
        console.error("[DateRangePicker] 날짜 변환 오류:", error);
        setIsInternalUpdate(false);
      }
    },
    []
  );

  // 컴포넌트 첫 마운트 시 초기화
  useEffect(() => {
    if (isInitialized) return;

    console.log("[DateRangePicker] 초기화 시작, 현재 timeRange:", timeRange);

    // 저장된 timeRange가 유효한지 확인
    if (timeRange.startTime > 0 && timeRange.endTime > 0) {
      console.log(
        "[DateRangePicker] 저장된 시간 범위 사용:",
        new Date(timeRange.startTime).toLocaleString(),
        new Date(timeRange.endTime).toLocaleString()
      );

      // 저장된 값이 있으면 UI에 반영
      updateValueFromTimeRange(timeRange.startTime, timeRange.endTime);
    } else {
      // 기본값: 지난 1시간
      const now = Date.now();
      const startTime = now - 3600000; // 1시간 전

      console.log(
        "[DateRangePicker] 기본 시간 범위 설정:",
        new Date(startTime).toLocaleString(),
        new Date(now).toLocaleString()
      );

      // 스토어 업데이트 후 UI 업데이트
      setTimeRange(startTime, now);
      updateValueFromTimeRange(startTime, now);
    }

    setIsInitialized(true);
  }, [timeRange, setTimeRange, updateValueFromTimeRange, isInitialized]);

  // 외부에서 timeRange가 변경되었을 때 UI 업데이트
  useEffect(() => {
    // 초기화 전이거나 내부 업데이트 중이면 무시
    if (!isInitialized || isInternalUpdate) return;

    // 이전 값과 현재 값이 다를 때만 업데이트
    if (
      timeRange.startTime !== prevTimeRangeRef.current.startTime ||
      timeRange.endTime !== prevTimeRangeRef.current.endTime
    ) {
      console.log(
        "[DateRangePicker] 외부 timeRange 변경 감지:",
        new Date(timeRange.startTime).toLocaleString(),
        new Date(timeRange.endTime).toLocaleString()
      );

      // 값이 유효한 경우에만 UI 업데이트
      if (timeRange.startTime > 0 && timeRange.endTime > 0) {
        updateValueFromTimeRange(timeRange.startTime, timeRange.endTime);
      }
    }
  }, [timeRange, updateValueFromTimeRange, isInitialized, isInternalUpdate]);

  // 사용자가 날짜를 선택했을 때 호출되는 함수
  const handleValueChange = useCallback(
    (newValue: RangeValue<CalendarDateTime> | null) => {
      // 유효한 값이 아니거나 내부 업데이트 중이면 무시
      if (!newValue?.start || !newValue?.end || isInternalUpdate) return;

      try {
        // locale-aware 날짜 변환
        const startTime = newValue.start.toDate(getLocalTimeZone()).getTime();
        const endTime = newValue.end.toDate(getLocalTimeZone()).getTime();

        console.log(
          "[DateRangePicker] 사용자 날짜 선택:",
          new Date(startTime).toLocaleString(),
          new Date(endTime).toLocaleString()
        );

        // UI 상태 먼저 업데이트
        setValue(newValue);

        // 이전 값과 다를 때만 스토어 업데이트 및 콜백 호출
        if (
          startTime !== timeRange.startTime ||
          endTime !== timeRange.endTime
        ) {
          // 스토어 업데이트
          setTimeRange(startTime, endTime);

          // 부모 컴포넌트 콜백 호출 (디바운싱 처리)
          if (onChange) {
            const timeoutId = setTimeout(() => {
              onChange(startTime, endTime);
            }, 200);

            return () => clearTimeout(timeoutId);
          }
        }
      } catch (error) {
        console.error("[DateRangePicker] 날짜 선택 처리 오류:", error);
      }
    },
    [setTimeRange, timeRange, onChange, isInternalUpdate]
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
