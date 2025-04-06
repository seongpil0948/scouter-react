// hooks/useECharts.ts
import { useRef, useState, useEffect, useLayoutEffect } from 'react';
import * as echarts from 'echarts';

interface UseEChartsOptions {
  theme?: string;
  renderer?: 'canvas' | 'svg';
  devicePixelRatio?: number;
}

/**
 * ECharts 인스턴스를 안전하게 관리하는 커스텀 훅
 */
export function useECharts(options: UseEChartsOptions = {}) {
  const { theme, renderer = 'canvas', devicePixelRatio } = options;
  
  // DOM 요소에 대한 참조
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  
  // ECharts 인스턴스 참조
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  
  // 컴포넌트 마운트 상태 추적
  const isMountedRef = useRef<boolean>(true);
  
  // 차트 준비 상태
  const [isReady, setIsReady] = useState<boolean>(false);
  
  // 초기화 락
  const initializingRef = useRef<boolean>(false);
  
  // 컴포넌트 마운트/언마운트 추적
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      // 컴포넌트 언마운트 시 차트 인스턴스 정리
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.dispose();
        } catch (e) {
          console.error('Failed to dispose chart instance:', e);
        }
        chartInstanceRef.current = null;
      }
    };
  }, []);
  
  // DOM 요소 준비 확인 및 차트 컨테이너 설정
  useEffect(() => {
    if (chartContainerRef.current) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, []);
  
  // 차트 인스턴스 초기화 함수
  const initChart = () => {
    if (initializingRef.current || !isMountedRef.current || !chartContainerRef.current) {
      return null;
    }
    
    try {
      initializingRef.current = true;
      
      // 이전 차트 인스턴스가 있으면 정리
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.dispose();
        } catch (e) {
          console.error('Failed to dispose previous chart instance:', e);
        }
        chartInstanceRef.current = null;
      }
      
      // 마운트 상태 재확인
      if (!isMountedRef.current || !chartContainerRef.current) {
        return null;
      }
      
      // 차트 인스턴스 초기화 옵션
      const initOptions = {
        renderer,
        devicePixelRatio
      };
      
      // 새 차트 인스턴스 생성
      const instance = echarts.init(
        chartContainerRef.current,
        theme,
        initOptions
      );
      
      chartInstanceRef.current = instance;
      
      // 리사이즈 이벤트 설정
      const handleResize = () => {
        if (chartInstanceRef.current && isMountedRef.current) {
          chartInstanceRef.current.resize();
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      // 정리 함수 반환
      return () => {
        window.removeEventListener('resize', handleResize);
        
        if (chartInstanceRef.current) {
          try {
            chartInstanceRef.current.dispose();
          } catch (e) {
            console.error('Failed to dispose chart instance:', e);
          }
          chartInstanceRef.current = null;
        }
      };
    } catch (e) {
      console.error('Failed to initialize chart:', e);
      return null;
    } finally {
      initializingRef.current = false;
    }
  };
  
  // DOM 조작 전에 차트 인스턴스 초기화
  useLayoutEffect(() => {
    if (!isReady || !chartContainerRef.current || !isMountedRef.current) {
      return;
    }
    
    // 안전하게 requestAnimationFrame 사용하여 DOM 업데이트 후 차트 초기화
    const animationId = window.requestAnimationFrame(() => {
      if (isMountedRef.current) {
        const cleanup = initChart();
        
        // 인스턴스가 준비되면 한 번 리사이즈
        if (chartInstanceRef.current) {
          setTimeout(() => {
            if (chartInstanceRef.current && isMountedRef.current) {
              chartInstanceRef.current.resize();
            }
          }, 0);
        }
        
        if (typeof cleanup === 'function') {
          return cleanup;
        }
      }
    });
    
    return () => {
      window.cancelAnimationFrame(animationId);
    };
  }, [isReady, theme, renderer, devicePixelRatio]);
  
  // 차트 옵션 설정 함수
  const setOption = (
    option: echarts.EChartsOption,
    opts?: echarts.SetOptionOpts
  ) => {
    if (!chartInstanceRef.current) {
      return;
    }
    
    try {
      chartInstanceRef.current.setOption(option, opts);
    } catch (e) {
      console.error('Failed to set chart option:', e);
    }
  };
  
  // 차트 리사이즈 함수
  const resize = () => {
    if (chartInstanceRef.current) {
      try {
        chartInstanceRef.current.resize();
      } catch (e) {
        console.error('Failed to resize chart:', e);
      }
    }
  };
  
  // 차트 정리 함수
  const dispose = () => {
    if (chartInstanceRef.current) {
      try {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      } catch (e) {
        console.error('Failed to dispose chart:', e);
      }
    }
  };
  
  // 이벤트 핸들러 등록 함수
  const on = (
    eventName: string,
    handler: Function,
    context?: object
  ) => {
    if (chartInstanceRef.current) {
      try {
        chartInstanceRef.current.on(eventName, handler as any, context);
      } catch (e) {
        console.error(`Failed to register event handler for ${eventName}:`, e);
      }
    }
  };
  
  // 이벤트 핸들러 해제 함수
  const off = (
    eventName: string,
    handler?: Function,
    context?: object
  ) => {
    if (chartInstanceRef.current) {
      try {
        chartInstanceRef.current.off(eventName, handler as any);
      } catch (e) {
        console.error(`Failed to unregister event handler for ${eventName}:`, e);
      }
    }
  };
  
  return {
    chartContainerRef,
    instance: chartInstanceRef.current,
    isReady,
    setOption,
    resize,
    dispose,
    on,
    off
  };
}

export default useECharts;