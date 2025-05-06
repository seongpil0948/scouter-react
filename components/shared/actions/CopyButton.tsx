// components/shared/actions/CopyButton.tsx
import React from "react";
import { Button, ButtonProps } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { Share2 } from "lucide-react";
import { copyToClipboard } from "@/lib/utils/clipboard";

interface CopyButtonProps {
  text: string;
  label?: string;
  tooltipContent?: string;
  buttonProps?: Partial<ButtonProps>;
  iconSize?: number;
}

/**
 * 복사 버튼 컴포넌트
 * 텍스트를 클립보드에 복사하는 기능
 */
export default function CopyButton({
  text,
  label,
  tooltipContent = "복사하기",
  buttonProps = {},
  iconSize = 16,
}: CopyButtonProps) {
  const handleCopy = () => {
    copyToClipboard(text, label);
  };

  return (
    <Tooltip content={tooltipContent}>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={handleCopy}
        {...buttonProps}
      >
        <Share2 size={iconSize} />
      </Button>
    </Tooltip>
  );
}
