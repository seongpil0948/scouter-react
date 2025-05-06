// components/shared/visualization/TimeDisplay.tsx
import React from "react";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/dateFormatter";
import { Tooltip } from "@heroui/tooltip";
import { Clock } from "lucide-react";

interface TimeDisplayProps {
  timestamp: number | string;
  showRelative?: boolean;
  className?: string;
  iconSize?: number;
  showIcon?: boolean;
}

/**
 * 시간 표시 컴포넌트
 * 옵션에 따라 상대 시간 표시 및 아이콘 포함 가능
 */
export default function TimeDisplay({
  timestamp,
  showRelative = true,
  className = "",
  iconSize = 14,
  showIcon = false,
}: TimeDisplayProps) {
  const formattedTime = formatDateTime(timestamp);
  const relativeTime = showRelative ? formatRelativeTime(timestamp) : null;

  return (
    <div className={`flex ${className}`}>
      {showIcon && <Clock className="mr-1 text-gray-500" size={iconSize} />}
      <div className="flex flex-col">
        <Tooltip content={new Date(Number(timestamp)).toISOString()}>
          <span>{formattedTime}</span>
        </Tooltip>
        {relativeTime && <span className="text-xs text-gray-500">{relativeTime}</span>}
      </div>
    </div>
  );
}
