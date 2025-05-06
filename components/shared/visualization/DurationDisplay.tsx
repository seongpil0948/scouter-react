// components/shared/visualization/DurationDisplay.tsx
import React from "react";
import { formatDuration } from "@/lib/utils/dateFormatter";
import { getLatencyColor } from "@/lib/utils/ui/statusUtils";
import { Tooltip } from "@heroui/tooltip";
import { Clock } from "lucide-react";
import { Badge } from "@heroui/badge";

interface DurationDisplayProps {
  duration: number;
  showIcon?: boolean;
  showColor?: boolean;
  iconSize?: number;
  className?: string;
  badgeClassName?: string;
}

/**
 * 지연 시간 표시 컴포넌트
 */
export default function DurationDisplay({
  duration,
  showIcon = true,
  showColor = true,
  iconSize = 14,
  className = "",
  badgeClassName = "",
}: DurationDisplayProps) {
  const formattedDuration = formatDuration(duration);
  const color = showColor ? getLatencyColor(duration) : undefined;

  return (
    <div className={`flex items-center ${className}`}>
      {showIcon && <Clock className="mr-1 text-gray-500" size={iconSize} />}
      <Tooltip content={`${duration}ms`}>
        {showColor ? (
          <Badge color={color} variant="flat" className={badgeClassName}>
            {formattedDuration}
          </Badge>
        ) : (
          <span>{formattedDuration}</span>
        )}
      </Tooltip>
    </div>
  );
}
