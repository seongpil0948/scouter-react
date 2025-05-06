// components/shared/visualization/StatusBadge.tsx
import React from "react";
import { Badge, BadgeProps } from "@heroui/badge";
import { Chip, ChipProps } from "@heroui/chip";
import { getStatusColor, renderStatusIcon, getSeverityColor, renderSeverityIcon } from "@/lib/utils/ui/statusUtils";

interface StatusBadgeProps {
  status?: string;
  variant?: "badge" | "chip";
  showIcon?: boolean;
  className?: string;
}

interface SeverityBadgeProps {
  severity?: string;
  variant?: "badge" | "chip";
  showIcon?: boolean;
  className?: string;
}

/**
 * 상태 표시 뱃지 컴포넌트
 */
export function StatusBadge({
  status,
  variant = "badge",
  showIcon = true,
  className = "",
}: StatusBadgeProps) {
  const color = getStatusColor(status);
  const icon = showIcon ? renderStatusIcon(status) : null;
  const content = (
    <>
      {icon}
      {status || "UNSET"}
    </>
  );

  if (variant === "chip") {
    return (
      <Chip
        color={color}
        variant="flat"
        className={`flex items-center ${className}`}
      >
        {content}
      </Chip>
    );
  }

  return (
    <Badge
      color={color}
      className={`flex items-center ${className}`}
    >
      {content}
    </Badge>
  );
}

/**
 * 심각도 표시 뱃지 컴포넌트
 */
export function SeverityBadge({
  severity,
  variant = "chip",
  showIcon = true,
  className = "",
}: SeverityBadgeProps) {
  const color = getSeverityColor(severity);
  const icon = showIcon ? renderSeverityIcon(severity) : null;
  const content = (
    <>
      {icon}
      {severity || "UNKNOWN"}
    </>
  );

  if (variant === "chip") {
    return (
      <Chip
        color={color}
        variant="flat"
        className={`flex items-center ${className}`}
      >
        {content}
      </Chip>
    );
  }

  return (
    <Badge
      color={color}
      className={`flex items-center ${className}`}
    >
      {content}
    </Badge>
  );
}
