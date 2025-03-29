"use client";
import React from "react";
import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import { FilterIcon, XIcon } from "lucide-react";

export interface FilterOption<T = string> {
  id: T;
  label: string;
  color?: string;
  count?: number;
}

interface FilterGroupProps<T = string> {
  title: string;
  options: FilterOption<T>[];
  selectedOptions: T[];
  onChange: (selectedOptions: T[]) => void;
  showCount?: boolean;
  multiSelect?: boolean;
}

const FilterGroup = <T extends string | number>({
  title,
  options,
  selectedOptions,
  onChange,
  showCount = true,
  multiSelect = true,
}: FilterGroupProps<T>) => {
  // 모든 필터 제거
  const handleClearAll = () => {
    onChange([]);
  };

  // 필터 토글
  const handleToggleOption = (optionId: T) => {
    if (selectedOptions.includes(optionId)) {
      // 이미 선택된 옵션 제거
      onChange(selectedOptions.filter((id) => id !== optionId));
    } else {
      // 옵션 추가 (멀티 선택 지원 여부에 따라)
      onChange(multiSelect ? [...selectedOptions, optionId] : [optionId]);
    }
  };

  // 색상 매핑
  const getColor = (option: FilterOption<T>) => {
    if (option.color) return option.color;

    if (selectedOptions.includes(option.id)) {
      return "bg-blue-500 hover:bg-blue-600 text-white";
    }

    return "bg-gray-200 text-gray-700 hover:bg-gray-300";
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center">
          <FilterIcon className="mr-1" size={16} />
          {title}
        </h3>

        {selectedOptions.length > 0 && (
          <Button
            className="text-xs h-6 px-2 text-gray-600"
            size="sm"
            variant="ghost"
            onClick={handleClearAll}
          >
            모두 지우기
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Badge
            key={option.id.toString()}
            className={`cursor-pointer ${getColor(option)}`}
            onClick={() => handleToggleOption(option.id)}
          >
            {option.label}
            {showCount && option.count !== undefined && ` (${option.count})`}
            {selectedOptions.includes(option.id) && (
              <XIcon className="ml-1" size={14} />
            )}
          </Badge>
        ))}

        {options.length === 0 && (
          <span className="text-sm text-gray-500">필터 옵션이 없습니다</span>
        )}
      </div>
    </div>
  );
};

export default FilterGroup;
