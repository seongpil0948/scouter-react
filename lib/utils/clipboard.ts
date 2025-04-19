import { addToast } from "@heroui/toast";

export const copyToClipboard = (text: string, label?: string) => {
  if (!navigator.clipboard) return;

  return navigator.clipboard
    .writeText(text)
    .then(() => {
      addToast({
        title: "복사 완료",
        description:
          (label ? `${label}이(가)` : "") + `클립보드에 복사되었습니다`,
        color: "success",
      });
    })
    .catch(() => {
      addToast({
        title: "복사 실패",
        description: "클립보드 접근에 실패했습니다",
        color: "danger",
      });
    });
};
