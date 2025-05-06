// components/shared/actions/ViewButton.tsx
import React from "react";
import { Button, ButtonProps } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { Eye } from "lucide-react";

interface ViewButtonProps {
  onPress: () => void;
  tooltipContent?: string;
  buttonProps?: Partial<ButtonProps>;
  iconSize?: number;
}

/**
 * 보기 버튼 컴포넌트
 * 상세 정보를 보기 위한 버튼
 */
export default function ViewButton({
  onPress,
  tooltipContent = "상세 보기",
  buttonProps = {},
  iconSize = 16,
}: ViewButtonProps) {
  return (
    <Tooltip content={tooltipContent}>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={onPress}
        {...buttonProps}
      >
        <Eye size={iconSize} />
      </Button>
    </Tooltip>
  );
}
