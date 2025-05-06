/**
 * API 요청을 관리하는 커스텀 훅
 */
import { useState, useCallback } from "react";
import { showApiErrorToast } from "@/lib/utils/notifications/toastManager";

interface ApiRequestState<T> {
  data: T | null;
  isLoading: boolean;
  error: any;
}

interface ApiRequestOptions {
  showErrorToast?: boolean;
  errorMessage?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

/**
 * API 요청 관리 훅
 * API 요청 상태 및 로딩/에러 처리를 편리하게 관리
 */
export function useApiRequest<T = any>(initialData: T | null = null) {
  // API 요청 상태 관리
  const [state, setState] = useState<ApiRequestState<T>>({
    data: initialData,
    isLoading: false,
    error: null
  });
  
  // 요청 함수
  const makeRequest = useCallback(async <R = T>(
    requestFn: () => Promise<R>,
    options: ApiRequestOptions = {}
  ): Promise<R | null> => {
    const {
      showErrorToast = true,
      errorMessage = "요청 처리 중 오류가 발생했습니다.",
      onSuccess,
      onError
    } = options;
    
    // 로딩 상태 시작
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // API 요청 실행
      const response = await requestFn();
      
      // 성공 상태 설정
      setState({
        data: response as unknown as T,
        isLoading: false,
        error: null
      });
      
      // 성공 콜백 호출
      if (onSuccess) {
        onSuccess(response);
      }
      
      return response;
    } catch (error) {
      // 오류 상태 설정
      setState(prev => ({
        ...prev,
        isLoading: false,
        error
      }));
      
      // 오류 토스트 표시
      if (showErrorToast) {
        showApiErrorToast(error, errorMessage);
      }
      
      // 오류 콜백 호출
      if (onError) {
        onError(error);
      }
      
      return null;
    }
  }, []);
  
  // 상태 리셋
  const reset = useCallback(() => {
    setState({
      data: initialData,
      isLoading: false,
      error: null
    });
  }, [initialData]);
  
  return {
    ...state,
    makeRequest,
    reset
  };
}

export default useApiRequest;
