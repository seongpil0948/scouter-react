/**
 * 토스트 메시지 관리 유틸리티
 */
import { addToast, ToastProps } from "@heroui/toast";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: React.ReactNode;
  onClose?: () => void;
}

/**
 * 토스트 메시지 생성 함수
 *
 * @param type 토스트 유형 (success, error, warning, info)
 * @param options 토스트 옵션
 * @returns 생성된 토스트 ID
 */
export function showToast(type: ToastType, options: ToastOptions) {
  const { title, description, duration = 5000, action, onClose } = options;

  // 토스트 유형에 따른 색상 및 기본 제목 설정
  let defaultTitle = "";
  let color: ToastProps["color"] = "default";

  switch (type) {
    case "success":
      defaultTitle = "성공";
      color = "success";
      break;
    case "error":
      defaultTitle = "오류";
      color = "danger";
      break;
    case "warning":
      defaultTitle = "경고";
      color = "warning";
      break;
    case "info":
      defaultTitle = "알림";
      color = "primary";
      break;
  }

  // 토스트 생성
  const toastId = addToast({
    title: title || defaultTitle,
    description: description,
    color,
    onClose,
  });
}

/**
 * 성공 토스트 메시지
 */
export function showSuccessToast(
  message: string,
  options: Omit<ToastOptions, "description"> = {}
): void {
  return showToast("success", { ...options, description: message });
}

/**
 * 오류 토스트 메시지
 */
export function showErrorToast(
  message: string,
  options: Omit<ToastOptions, "description"> = {}
): void {
  return showToast("error", { ...options, description: message });
}

/**
 * 경고 토스트 메시지
 */
export function showWarningToast(
  message: string,
  options: Omit<ToastOptions, "description"> = {}
): void {
  return showToast("warning", { ...options, description: message });
}

/**
 * 정보 토스트 메시지
 */
export function showInfoToast(
  message: string,
  options: Omit<ToastOptions, "description"> = {}
): void {
  return showToast("info", { ...options, description: message });
}

/**
 * API 오류 처리 토스트
 */
export function showApiErrorToast(
  error: any,
  fallbackMessage = "요청 처리 중 오류가 발생했습니다."
): void {
  let errorMessage = fallbackMessage;

  // 오류 객체에서 메시지 추출 시도
  if (typeof error === "string") {
    errorMessage = error;
  } else if (error?.message) {
    errorMessage = error.message;
  } else if (error?.response?.data?.message) {
    errorMessage = error.response.data.message;
  } else if (error?.data?.message) {
    errorMessage = error.data.message;
  }

  return showErrorToast(errorMessage);
}

export default {
  showToast,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showApiErrorToast,
};
