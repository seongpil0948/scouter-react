/**
 * 로컬 스토리지를 사용하는 상태 관리 훅
 */
import { useState, useEffect, useCallback } from "react";

interface UseLocalStorageOptions<T> {
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
}

/**
 * 로컬 스토리지 상태 관리 훅
 * 
 * @param key 로컬 스토리지 키
 * @param initialValue 초기값
 * @param options 직렬화/역직렬화 옵션
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
) {
  // 기본 직렬화/역직렬화 함수
  const {
    serializer = JSON.stringify,
    deserializer = JSON.parse
  } = options;
  
  // 로컬 스토리지에서 값 가져오기
  const readValueFromStorage = useCallback((): T => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? deserializer(item) : initialValue;
    } catch (error) {
      console.warn(`로컬 스토리지에서 키 "${key}" 읽기 오류:`, error);
      return initialValue;
    }
  }, [key, initialValue, deserializer]);
  
  // 상태 초기화
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  
  // 로컬 스토리지 값 설정
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // 새 값 계산
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // 상태 업데이트
      setStoredValue(valueToStore);
      
      // 로컬 스토리지 업데이트
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, serializer(valueToStore));
        
        // 스토리지 이벤트 발생 (다른 탭/창에 알림)
        const storageEvent = new Event('storage');
        window.dispatchEvent(storageEvent);
      }
    } catch (error) {
      console.warn(`로컬 스토리지에 키 "${key}" 저장 오류:`, error);
    }
  }, [key, serializer, storedValue]);
  
  // 값 삭제
  const removeValue = useCallback(() => {
    try {
      // 상태 초기화
      setStoredValue(initialValue);
      
      // 로컬 스토리지에서 항목 제거
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
        
        // 스토리지 이벤트 발생
        const storageEvent = new Event('storage');
        window.dispatchEvent(storageEvent);
      }
    } catch (error) {
      console.warn(`로컬 스토리지에서 키 "${key}" 삭제 오류:`, error);
    }
  }, [key, initialValue]);
  
  // 페이지 로드 시 로컬 스토리지에서 값 읽기
  useEffect(() => {
    setStoredValue(readValueFromStorage());
  }, [readValueFromStorage]);
  
  // 동일한 키에 대한 다른 탭/창의 변경 감지
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = deserializer(e.newValue);
          setStoredValue(newValue);
        } catch (error) {
          console.warn(`스토리지 이벤트 처리 오류:`, error);
        }
      } else if (e.key === key && e.newValue === null) {
        setStoredValue(initialValue);
      }
    };
    
    // 스토리지 이벤트 리스너 등록
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      // 이벤트 리스너 제거
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, deserializer, initialValue]);
  
  return {
    value: storedValue,
    setValue,
    removeValue
  };
}

export default useLocalStorage;
