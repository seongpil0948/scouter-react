import React, { useEffect, useState, useCallback, useRef } from "react";
import { DateRangePicker as HeroDateRangePicker } from "@heroui/date-picker";
import { Clock } from "lucide-react";
import {
  CalendarDateTime,
  getLocalTimeZone,
  fromDate,
  toCalendarDateTime,
} from "@internationalized/date";
import { RangeValue } from "@react-types/shared";

import { useFilterStore } from "@/lib/store/telemetryStore";
import { Chip } from "@heroui/chip";

interface DateRangePickerProps {
  onChange?: (startTime: number, endTime: number) => void;
  isDisabled?: boolean;
}

/**
 * Enhanced DateRangePicker component with better state management
 * for selecting time ranges for trace data
 */
const DateRangePicker: React.FC<DateRangePickerProps> = ({
  onChange,
  isDisabled = false,
}) => {
  // Get time range state from store
  const { timeRange, setTimeRange, isRealtime } = useFilterStore();

  // State for picker value
  const [value, setValue] = useState<RangeValue<CalendarDateTime> | null>(null);

  // Refs to track internal state
  const isInternalUpdateRef = useRef(false);
  const isComponentMountedRef = useRef(false);
  const prevTimeRangeRef = useRef({ startTime: 0, endTime: 0 });

  // Convert timestamp to CalendarDateTime safely
  const convertToCalendarDateTime = useCallback((timestamp: number) => {
    try {
      if (!timestamp || timestamp <= 0) return null;

      const date = new Date(timestamp);
      const zonedDateTime = fromDate(date, getLocalTimeZone());
      return toCalendarDateTime(zonedDateTime);
    } catch (error) {
      console.error(
        `[DateRangePicker] Error converting timestamp ${timestamp}:`,
        error
      );
      return null;
    }
  }, []);

  // Check if time range has significantly changed
  const hasTimeRangeChanged = useCallback(
    (oldStart: number, oldEnd: number, newStart: number, newEnd: number) => {
      // Skip if either is invalid
      if ((oldStart <= 0 && newStart <= 0) || (oldEnd <= 0 && newEnd <= 0)) {
        return false;
      }

      // Consider changed if any is invalid
      if (oldStart <= 0 || oldEnd <= 0 || newStart <= 0 || newEnd <= 0) {
        return true;
      }

      // Consider changed if difference is > 1 second
      const startDiff = Math.abs(oldStart - newStart);
      const endDiff = Math.abs(oldEnd - newEnd);

      return startDiff > 1000 || endDiff > 1000;
    },
    []
  );

  // Update UI when timeRange changes in store
  const updateUIFromTimeRange = useCallback(() => {
    // Skip if internal update is in progress
    if (isInternalUpdateRef.current) return;

    try {
      isInternalUpdateRef.current = true;

      const { startTime, endTime } = timeRange;

      // Handle invalid time range
      if (startTime <= 0 || endTime <= 0) {
        console.log("[DateRangePicker] Invalid timeRange, using default");
        const now = Date.now();
        const oneHourAgo = now - 3600000;
        setTimeRange(oneHourAgo, now);
        setValue(null);
        return;
      }

      // Skip if no significant change
      if (
        !hasTimeRangeChanged(
          prevTimeRangeRef.current.startTime,
          prevTimeRangeRef.current.endTime,
          startTime,
          endTime
        )
      ) {
        return;
      }

      console.log(
        "[DateRangePicker] Updating UI with timeRange:",
        new Date(startTime).toLocaleString(),
        new Date(endTime).toLocaleString()
      );

      // Convert timestamps to CalendarDateTime
      const startDateTime = convertToCalendarDateTime(startTime);
      const endDateTime = convertToCalendarDateTime(endTime);

      if (startDateTime && endDateTime) {
        setValue({
          start: startDateTime,
          end: endDateTime,
        });

        // Save for comparison
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
      // Reset internal update flag
      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 10);
    }
  }, [timeRange, hasTimeRangeChanged, convertToCalendarDateTime, setTimeRange]);

  // Initialize component
  useEffect(() => {
    isComponentMountedRef.current = true;

    // Initialize UI with existing timeRange or default
    if (timeRange.startTime > 0 && timeRange.endTime > 0) {
      console.log(
        "[DateRangePicker] Component mounted, using existing timeRange:",
        new Date(timeRange.startTime).toLocaleString(),
        new Date(timeRange.endTime).toLocaleString()
      );
      updateUIFromTimeRange();
    } else {
      // Set default time range
      const now = Date.now();
      const oneHourAgo = now - 3600000;

      console.log(
        "[DateRangePicker] Component mounted, setting default timeRange:",
        new Date(oneHourAgo).toLocaleString(),
        new Date(now).toLocaleString()
      );

      // Update store
      setTimeRange(oneHourAgo, now);
      prevTimeRangeRef.current = { startTime: oneHourAgo, endTime: now };

      // Update UI directly
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

  // Watch for timeRange changes in store
  useEffect(() => {
    if (!isComponentMountedRef.current || isInternalUpdateRef.current) return;

    // Update UI if store timeRange is different than local state
    if (
      timeRange.startTime !== prevTimeRangeRef.current.startTime ||
      timeRange.endTime !== prevTimeRangeRef.current.endTime
    ) {
      updateUIFromTimeRange();
    }
  }, [timeRange, updateUIFromTimeRange]);

  // Handle user selection in the date picker
  const handleValueChange = useCallback(
    (newValue: RangeValue<CalendarDateTime> | null) => {
      // Skip if no valid selection or internal update in progress
      if (!newValue?.start || !newValue?.end || isInternalUpdateRef.current) {
        return;
      }

      try {
        isInternalUpdateRef.current = true;

        // Update UI state
        setValue(newValue);

        // Convert to timestamps
        const startTime = newValue.start.toDate(getLocalTimeZone()).getTime();
        const endTime = newValue.end.toDate(getLocalTimeZone()).getTime();

        console.log(
          "[DateRangePicker] User selected date range:",
          new Date(startTime).toLocaleString(),
          new Date(endTime).toLocaleString()
        );

        // Update if changed
        if (
          hasTimeRangeChanged(
            timeRange.startTime,
            timeRange.endTime,
            startTime,
            endTime
          )
        ) {
          // Update store
          setTimeRange(startTime, endTime);
          prevTimeRangeRef.current = { startTime, endTime };

          // Notify parent
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
        // Reset flag
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
