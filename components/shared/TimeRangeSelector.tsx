"use client";

import React from "react";
import { Button } from "@heroui/button";
import { Clock } from "lucide-react";
import { ButtonGroup } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";

import { useChartStore, TimeRangeOption, timeRangeToMs } from "@/lib/store/chartStore";
import { formatDuration } from "@/lib/utils/dateFormatter";

interface TimeRangeSelectorProps {
  onRangeChange?: (start: number, end: number) => void;
  className?: string;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  onRangeChange,
  className = "",
}) => {
  const { timeRange, setTimeRange } = useChartStore();

  // Label mapping for each time range option
  const timeRangeLabels: Record<TimeRangeOption, string> = {
    '1m': '1분',
    '5m': '5분',
    '10m': '10분',
    '1h': '1시간',
    '3h': '3시간',
    '6h': '6시간',
    '12h': '12시간',
    '1d': '1일',
  };

  // Handle time range selection
  const handleRangeSelect = (range: TimeRangeOption) => {
    setTimeRange(range);
    
    // Calculate actual time range in milliseconds
    const endTime = Date.now();
    const startTime = endTime - timeRangeToMs(range);
    
    // Notify parent component if callback provided
    if (onRangeChange) {
      onRangeChange(startTime, endTime);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Tooltip content="조회 기간 선택">
        <Clock className="text-gray-500" size={18} />
      </Tooltip>
      
      <ButtonGroup variant="flat" className="flex flex-wrap">
        {(Object.keys(timeRangeLabels) as TimeRangeOption[]).map((range) => (
          <Button
            key={range}
            size="sm"
            className={timeRange === range ? "bg-blue-100 dark:bg-blue-800" : ""}
            onPress={() => handleRangeSelect(range)}
          >
            {timeRangeLabels[range]}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  );
};

export default TimeRangeSelector;