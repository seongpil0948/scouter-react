/**
 * 세션 스토리지를 사용하는 상태 관리 훅
 */
import { useState, useEffect, useCallback } from "react";

interface UseSessionStorageOptions<T> {
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
}

/**
 * 세션 스토리지 상태 관리 훅
 * 
 * @param key 세션 스토리지 키
 * @param initialValue 초기값
 * @param options 직렬화/역직렬화 옵션
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T,
  options: UseSessionStorageOptions<T> = {}
) {
  // 기본 직렬화/역직렬화 함수
  const {
    serializer = JSON.stringify,
    deserializer = JSON.parse
  } = options;
  
  // 세션 스토리지에서 값 가져오기
  const readValueFromStorage = useCallback((): T => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    
    try {
      const item = window.sessionStorage.getItem(key);
      return item !== null ? deserializer(item) : initialValue;
    } catch (error) {
      console.warn(`세션 스토리지에서 키 "${key}" 읽기 오류:`, error);
      return initialValue;
    }
  }, [key, initialValue, deserializer]);
  
  // 상태 초기화
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  
  // 세션 스토리지 값 설정
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // 새 값 계산
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // 상태 업데이트
      setStoredValue(valueToStore);
      
      // 세션 스토리지 업데이트
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(key, serializer(valueToStore));
        
        // 스토리지 이벤트 발생 (같은 탭 내 다른 컴포넌트에 알림)
        const storageEvent = new Event('sessionStorageChange');
        window.dispatchEvent(storageEvent);
      }
    } catch (error) {
      console.warn(`세션 스토리지에 키 "${key}" 저장 오류:`, error);
    }
  }, [key, serializer, storedValue]);
  
  // 값 삭제
  const removeValue = useCallback(() => {
    try {
      // 상태 초기화
      setStoredValue(initialValue);
      
      // 세션 스토리지에서 항목 제거
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(key);
        
        // 스토리지 이벤트 발생
        const storageEvent = new Event('sessionStorageChange');
        window.dispatchEvent(storageEvent);
      }
    } catch (error) {
      console.warn(`세션 스토리지에서 키 "${key}" 삭제 오류:`, error);
    }
  }, [key, initialValue]);
  
  // 페이지 로드 시 세션 스토리지에서 값 읽기
  useEffect(() => {
    setStoredValue(readValueFromStorage());
  }, [readValueFromStorage]);
  
  // 커스텀 이벤트로 같은 탭 내 변경 감지 (세션 스토리지는 다른 탭에 이벤트 전파 안 됨)
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const item = window.sessionStorage.getItem(key);
        if (item !== null) {
          setStoredValue(deserializer(item));
        } else {
          setStoredValue(initialValue);
        }
      } catch (error) {
        console.warn(`세션 스토리지 이벤트 처리 오류:`, error);
      }
    };
    
    // 커스텀 이벤트 리스너 등록
    window.addEventListener('sessionStorageChange', handleStorageChange);
    
    return () => {
      // 이벤트 리스너 제거
      window.removeEventListener('sessionStorageChange', handleStorageChange);
    };
  }, [key, deserializer, initialValue]);
  
  return {
    value: storedValue,
    setValue,
    removeValue
  };
}

export default useSessionStorage;
