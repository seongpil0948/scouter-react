// components/shared/visualization/AttributeChips.tsx
import React from "react";
import { Chip, ChipProps } from "@heroui/chip";
import { Database, Globe, AlertTriangle } from "lucide-react";

interface AttributeChipsProps {
  attributes: Record<string, any>;
  filterKeys?: string[];
  maxDisplay?: number;
  className?: string;
}

/**
 * 속성(Attributes) 시각화 컴포넌트
 * 속성 키/값 쌍을 칩 형태로 표시
 */
export default function AttributeChips({
  attributes,
  filterKeys,
  maxDisplay = 2,
  className = "",
}: AttributeChipsProps) {
  if (!attributes || Object.keys(attributes).length === 0) {
    return null;
  }

  // 필터링된 속성 목록 가져오기
  const filteredEntries = Object.entries(attributes).filter(([key]) => {
    if (!filterKeys || filterKeys.length === 0) {
      // 기본 필터: SQL, HTTP, 에러 관련 속성
      return (
        key.startsWith("sql.") ||
        key.startsWith("http.") ||
        key.includes("error")
      );
    }
    
    // 사용자 정의 필터 사용
    return filterKeys.some(filter => key.includes(filter));
  });

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {filteredEntries.slice(0, maxDisplay).map(([key, value]) => {
        const isSQL = key.startsWith("sql.") || key === "db.statement";
        const isHTTP = key.startsWith("http.") || key.startsWith("url.");
        const isError = key.includes("error");

        let chipColor: ChipProps["color"] = "default";
        let icon = null;

        if (isSQL) {
          chipColor = "secondary";
          icon = <Database size={12} className="mr-1" />;
        } else if (isHTTP) {
          chipColor = "primary";
          icon = <Globe size={12} className="mr-1" />;
        } else if (isError) {
          chipColor = "danger";
          icon = <AlertTriangle size={12} className="mr-1" />;
        }

        const displayKey = key.split(".").pop() || key;
        const displayValue =
          String(value).substring(0, 15) +
          (String(value).length > 15 ? "..." : "");

        return (
          <Chip
            key={key}
            size="sm"
            variant="flat"
            color={chipColor}
            className="text-xs flex items-center"
          >
            {icon}
            {displayKey}: {displayValue}
          </Chip>
        );
      })}

      {filteredEntries.length > maxDisplay && (
        <Chip size="sm" variant="flat" className="text-xs">
          +{filteredEntries.length - maxDisplay}
        </Chip>
      )}
    </div>
  );
}
