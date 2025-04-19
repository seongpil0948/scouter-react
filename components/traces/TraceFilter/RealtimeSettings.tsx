import React, { useCallback } from "react";
import { Switch } from "@heroui/switch";
import { Select, SelectItem } from "@heroui/select";
import { Clock } from "lucide-react";
import {
  RefreshIntervalOption,
  RealtimeRangeOption,
} from "@/lib/hooks/useTraceData";
import clsx from "clsx";

interface RealtimeSettingsProps {
  isRealtime: boolean;
  onToggleRealtime: (enabled: boolean) => void;
  refreshInterval: RefreshIntervalOption;
  onRefreshIntervalChange: (interval: RefreshIntervalOption) => void;
  realtimeRange: RealtimeRangeOption;
  onRealtimeRangeChange: (range: RealtimeRangeOption) => void;
}

const RealtimeSettings: React.FC<RealtimeSettingsProps> = ({
  isRealtime,
  onToggleRealtime,
  refreshInterval,
  onRefreshIntervalChange,
  realtimeRange,
  onRealtimeRangeChange,
}) => {
  // 실시간 갱신 간격 변경 핸들러
  const handleRefreshIntervalChange = useCallback(
    (keys: any) => {
      if (typeof keys === "string") return;
      const key = Array.from(keys)[0];
      const interval = parseInt(String(key)) as RefreshIntervalOption;
      if (interval !== refreshInterval) {
        onRefreshIntervalChange(interval);
      }
    },
    [onRefreshIntervalChange, refreshInterval]
  );

  // 실시간 조회 범위 변경 핸들러
  const handleRealtimeRangeChange = useCallback(
    (keys: any) => {
      if (typeof keys === "string") return;
      const key = Array.from(keys)[0];
      const range = parseInt(String(key)) as RealtimeRangeOption;
      if (range !== realtimeRange) {
        onRealtimeRangeChange(range);
      }
    },
    [onRealtimeRangeChange, realtimeRange]
  );

  return (
    <div className="flex gap-2 min-w-[200px]">
      <Switch
        isSelected={isRealtime}
        onValueChange={onToggleRealtime}
        size="sm"
        aria-label="실시간 갱신 토글"
      />
      <div className="flex items-center text-sm">
        <Clock
          size={16}
          className={`mr-1 ${isRealtime ? "text-blue-500" : "text-gray-500"}`}
        />
        <span className={clsx(isRealtime ? "text-blue-500" : "text-gray-500", "min-w-[80px]")}>
          실시간 갱신
        </span>
      </div>

      {isRealtime && (
        <>
            <Select
              label="갱신 간격"
              aria-label="실시간 갱신 간격 선택"
              size="sm"
              selectedKeys={[refreshInterval.toString()]}
              onSelectionChange={handleRefreshIntervalChange}
              className="w-full"
            >
              <SelectItem key="5" textValue="5초">
                5초
              </SelectItem>
              <SelectItem key="10" textValue="10초">
                10초
              </SelectItem>
              <SelectItem key="30" textValue="30초">
                30초
              </SelectItem>
              <SelectItem key="60" textValue="60초">
                60초
              </SelectItem>
            </Select>

            <Select
              label="조회 범위"
              aria-label="실시간 조회 범위 선택"
              size="sm"
              selectedKeys={[realtimeRange.toString()]}
              onSelectionChange={handleRealtimeRangeChange}
              className="w-full"
            >
              <SelectItem key="1" textValue="1분">
                1분
              </SelectItem>
              <SelectItem key="5" textValue="5분">
                5분
              </SelectItem>
              <SelectItem key="10" textValue="10분">
                10분
              </SelectItem>
              <SelectItem key="15" textValue="15분">
                15분
              </SelectItem>
              <SelectItem key="30" textValue="30분">
                30분
              </SelectItem>
            </Select>
        </>
      )}
    </div>
  );
};

export default RealtimeSettings;
