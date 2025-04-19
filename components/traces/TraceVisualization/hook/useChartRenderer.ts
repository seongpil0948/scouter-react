// components/traces/TraceVisualization/hook/useChartRenderer.ts
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import * as echarts from 'echarts';
import { ECharts, EChartsInitOpts, ECElementEvent } from 'echarts'; // Import necessary types
import { useTheme } from 'next-themes';
import { useIsSSR } from '@react-aria/ssr';
import { DEFAULT_CHART_CONFIG } from '../utils';
import { generateChartOptions } from '../chartOptions';



/**
 * ECharts 렌더링과 브러시 이벤트를 처리하는 커스텀 훅
 */
export function useChartRenderer({
  data,
  config = {},
  legendState,
  onDataPointClick,
  onBrushSelected,
  serviceThresholds
}: UseChartRendererProps) { // Apply props type
  // SSR 체크
  const isSSR = useIsSSR();
  
  // Refs
  const chartContainerRef = useRef<HTMLDivElement>(null); // Type ref
  const chartInstanceRef = useRef<ECharts | null>(null); // Type ref
  const isInitializingRef = useRef(false);
  const isMountedRef = useRef(true);
  const prevSeriesDataRef = useRef<SeriesData | null>(null); // Type ref
  const prevRangeRef = useRef<RangeBounds | null>(null); // Type ref
  
  // State
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Theme
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = resolvedTheme || theme;
  
  // Merged configuration
  const mergedConfig = useMemo(() => ({
    ...DEFAULT_CHART_CONFIG,
    ...config,
  }), [config]);
  
  // 실시간 모드 상태
  const isRealtime = useMemo(() => mergedConfig.autoUpdate === true, [mergedConfig.autoUpdate]);
  
  // Clean up on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.dispose(); // Check before dispose
        } catch (e) {
          console.error('Failed to dispose chart:', e);
        }
        chartInstanceRef.current = null;
      }
    };
  }, []);
  
  // Convert serviceThresholds object to Map for generateChartOptions
  const serviceThresholdsMap = useMemo(() => {
    return new Map(Object.entries(serviceThresholds));
  }, [serviceThresholds]);

  // 브러시 이벤트 핸들러
  const handleBrushSelected = useCallback((params: BrushParams) => { // Type params
    if (!onBrushSelected || !data.metadataMap) return;
    
    // 선택된 데이터를 저장할 배열
    const selectedData: SelectedTraceData[] = []; // Type variable
    
    // batch가 존재하고 배열인지 확인
    if (!params.batch || !Array.isArray(params.batch) || params.batch.length === 0) {
      return;
    }
    
    // 각 배치 처리
    params.batch.forEach((batchItem: BatchItem) => { // Type batchItem
      // selected 배열이 존재하는지 확인
      if (!batchItem.selected || !Array.isArray(batchItem.selected)) {
        return;
      }
      
      // 각 시리즈 데이터 처리
      batchItem.selected.forEach((selection: SelectionItem) => { // Type selection
        // 시리즈 인덱스와 데이터 인덱스 가져오기
        const seriesIndex = selection.seriesIndex;
        const dataIndices = selection.dataIndex;
        
        // 데이터 인덱스가 비어있지 않은지 확인
        if (!dataIndices || !Array.isArray(dataIndices) || dataIndices.length === 0) {
          return;
        }
        
        // 해당 시리즈의 데이터 배열 가져오기
        // Ensure data properties exist before accessing them
        const seriesData = seriesIndex === 0 
          ? (data.timeSeriesData || []) 
          : (data.highLatencyData || []);
        
        // 각 인덱스에 해당하는 데이터 처리
        dataIndices.forEach((index) => {
          if (index >= 0 && index < seriesData.length) {
            const point = seriesData[index];
            if (!point) return;
            
            const timestamp = point[0];
            const latency = point[1];
            
            // 메타데이터 가져오기
            const metadata = data.metadataMap.get(timestamp);
            
            if (metadata && metadata.traceItem) {
              selectedData.push({
                timestamp,
                latency,
                serviceName: metadata.serviceName || '',
                status: metadata.status,
                traceId: metadata.traceItem.traceId,
                name: metadata.traceItem.name,
                traceItem: metadata.traceItem
              });
            }
          }
        });
      });
    });
    
    // 중복 제거 (traceId 기준)
    const uniqueSelectedData = Array.from(
      new Map(selectedData.map(item => [item.traceId, item])).values()
    );
    
    // 정렬 (시간순)
    uniqueSelectedData.sort((a, b) => a.timestamp - b.timestamp);
    
    // 선택된 데이터가 있으면 콜백 호출
    if (uniqueSelectedData.length > 0) {
      onBrushSelected(uniqueSelectedData);
    }
  }, [data.highLatencyData, data.metadataMap, data.timeSeriesData, onBrushSelected]);
  
  // Initialize chart instance - SSR Safe
  const initChart = useCallback(() => {
    // SSR 환경이거나 이미 초기화 중이면 건너뛰기
    if (isSSR || isInitializingRef.current || !isMountedRef.current || !chartContainerRef.current) {
      return null;
    }
    
    try {
      isInitializingRef.current = true;
      
      // 이전 차트 인스턴스 정리
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.dispose();
          chartInstanceRef.current = null;
        } catch (error) {
          console.error("Failed to dispose chart:", error);
        }
      }
      
      // 마운트 상태 재확인
      if (!isMountedRef.current || !chartContainerRef.current) {
        return null;
      }
      
      // 차트 인스턴스 초기화 옵션
      const initOptions: EChartsInitOpts = { // Type initOptions
        renderer: 'canvas', // Use string literal 'canvas' or 'svg'
        devicePixelRatio: window.devicePixelRatio,
        useDirtyRect: true,
        // locale: 'KO' // Removed potentially problematic locale
      };
      
      // 새 차트 인스턴스 생성
      const instance = echarts.init(
        chartContainerRef.current,
        currentTheme === "dark" ? "dark" : undefined, // Theme can be string or undefined
        initOptions
      );
      
      chartInstanceRef.current = instance;
      
      // 차트 옵션 생성 및 설정 (외부 함수 사용)
      // Pass the converted Map
      const options = generateChartOptions(data, legendState, mergedConfig, currentTheme || 'light', serviceThresholdsMap, isRealtime); 
      instance.setOption(options);
      
      // 브러시 선택 이벤트 리스너 등록
      if (onBrushSelected) {
        // Use 'any' for params if specific type causes issues, or find the exact ECharts event type
        instance.on('brushselected', (params: any) => handleBrushSelected(params as BrushParams)); 
      }
      
      // 클릭 이벤트 핸들러 등록
      if (onDataPointClick) {
        // Define click handler separately for potential removal
        const clickHandler = (params: ECElementEvent) => { // Type params
          if (params && params.value && Array.isArray(params.value) && params.value.length > 0) {
            // Assuming the first element of value is the timestamp
            if (typeof params.value[0] === 'number') {
              onDataPointClick(params.value[0]);
            }
          }
        };
        instance.on('click', clickHandler);
      }
      
      // 리사이즈 이벤트 설정
      const handleResize = () => {
        if (chartInstanceRef.current && isMountedRef.current) {
          chartInstanceRef.current.resize(); // Check before resize
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      // 정리 함수 반환
      return () => {
        window.removeEventListener('resize', handleResize);
        
        if (chartInstanceRef.current) {
          // Remove specific listeners before disposing
          chartInstanceRef.current.off('brushselected'); // Remove listener by event name if handler reference isn't stable or causes issues
          // If clickHandler was defined outside and accessible here, use it:
          // chartInstanceRef.current.off('click', clickHandler);
          // Otherwise, removing all 'click' listeners might be necessary if added anonymously:
          chartInstanceRef.current.off('click'); 
          
          try {
            chartInstanceRef.current.dispose(); // Check before dispose
          } catch (e) {
            console.error('Failed to dispose chart instance:', e);
          }
          chartInstanceRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error initializing chart:', error);
      return null;
    } finally {
      isInitializingRef.current = false;
    }
  }, [
    isSSR, 
    currentTheme, 
    handleBrushSelected, // Keep handleBrushSelected dependency
    onBrushSelected, 
    onDataPointClick,
    data,
    legendState,
    mergedConfig,
    serviceThresholdsMap, // Use the map dependency
    isRealtime
  ]);
  
  // Initialize chart on mount - Client only
  useEffect(() => {
    // SSR 환경이면 건너뛰기
    if (isSSR) return;
    
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        initChart();
        setIsReady(true);
      }
    }, 50);
    
    return () => {
      clearTimeout(timer);
    };
  }, [isSSR, initChart]);
  
  // 데이터 또는 설정 변경 시 차트 업데이트
  useEffect(() => {
    if (!chartInstanceRef.current || !isReady || isSSR) return;
    
    try {
      setIsLoading(true);
      
      // Re-register brush listener if needed (ensure correct handler reference)
      if (onBrushSelected) {
        chartInstanceRef.current.off('brushselected'); // Remove previous first
        // Use 'any' for params if specific type causes issues
        chartInstanceRef.current.on('brushselected', (params: any) => handleBrushSelected(params as BrushParams)); 
      }
      
      // 데이터가 있는지 확인
      const hasTimeSeriesData = data.timeSeriesData && data.timeSeriesData.length > 0;
      const hasHighLatencyData = data.highLatencyData && data.highLatencyData.length > 0;
      
      if (hasTimeSeriesData || hasHighLatencyData) {
        // 모든 데이터 포인트 통합
        const allPoints = [
          ...(legendState.normal && data.timeSeriesData ? data.timeSeriesData : []),
          ...(legendState.highLatency && data.highLatencyData ? data.highLatencyData : []),
        ];
        
        if (allPoints.length > 0) {
          // 타임스탬프 범위 계산
          const timestamps = allPoints.map(point => point[0]);
          const latencies = allPoints.map(point => point[1]);
          const currentMinTime = Math.min(...timestamps);
          const currentMaxTime = Math.max(...timestamps);
          const maxLatency = Math.max(...latencies, 1) * 1.2; // 20% 여유
          
          // 이전 x축 범위 가져오기 (없으면 현재 계산된 범위 사용)
          const prevOption = chartInstanceRef.current.getOption(); // Check before getOption
          // Handle xAxis option which can be a single object or an array
          const xAxisOption = prevOption?.xAxis as echarts.EChartsOption['xAxis'];
          const prevXAxis = Array.isArray(xAxisOption) ? xAxisOption[0] : (xAxisOption ?? {});
          const prevMinTime = prevXAxis.min as number | undefined;
          const prevMaxTime = prevXAxis.max as number | undefined;
          
          // 새로운 시간 범위 계산
          let newMinTime = currentMinTime;
          let newMaxTime = currentMaxTime;
          
          // 실시간 모드이고 이전 범위가 있는 경우
          if (isRealtime && prevMinTime !== undefined && prevMaxTime !== undefined) {
            // 윈도우 크기 유지 (시간 이동)
            const timeWindow = prevMaxTime - prevMinTime;
            
            // 새 데이터가 이전 최대 시간보다 큰 경우에만 이동
            if (currentMaxTime > prevMaxTime) {
              newMinTime = currentMaxTime - timeWindow;
              newMaxTime = currentMaxTime;
            } else {
              // 변경 없이 이전 범위 유지
              newMinTime = prevMinTime;
              newMaxTime = prevMaxTime;
            }
          }
          
          // 현재 범위 저장
          prevRangeRef.current = { // Assign typed object
            min: newMinTime,
            max: newMaxTime
          };
          
          // 현재 데이터 저장
          prevSeriesDataRef.current = { // Assign typed object
            timeSeriesData: [...(data.timeSeriesData || [])],
            highLatencyData: [...(data.highLatencyData || [])]
          };
          
          // 업데이트 옵션 생성
          const updateOption = {
            series: [
              { 
                // 기본 series는 항상 배열의 첫 번째 요소
                name: "일반 요청",
                type: "scatter",
                data: legendState.normal ? (data.timeSeriesData || []) : [], // Check data exists
                animation: !isRealtime,
              },
              { 
                // highlight series는 항상 배열의 두 번째 요소
                name: "고지연 요청",
                type: "effectScatter",
                data: legendState.highLatency ? (data.highLatencyData || []) : [], // Check data exists
                animation: !isRealtime,
              },
            ],
            xAxis: {
              min: newMinTime,
              max: newMaxTime,
              animation: isRealtime,
              animationDurationUpdate: 300
            },
            yAxis: {
              min: 0,
              max: maxLatency,
              animation: false
            }
          };
          
          // 차트 인스턴스 업데이트
          chartInstanceRef.current.setOption(updateOption, { // Check before setOption
            notMerge: false,
            replaceMerge: ['series'],
            lazyUpdate: true,
            silent: isRealtime // 실시간 모드에서는 불필요한 이벤트 발생 최소화
          });
        }
      } else {
        // 데이터가 없는 경우 빈 시리즈 설정
        chartInstanceRef.current.setOption({ // Check before setOption
          series: [
            { 
              name: "일반 요청",
              type: "scatter",
              data: []
            },
            { 
              name: "고지연 요청",
              type: "effectScatter",
              data: []
            }
          ]
        }, {
          notMerge: false, // Keep notMerge false to clear previous data if any
          replaceMerge: ['series'] // Ensure series are replaced
        });
      }
    } catch (error) {
      console.error("차트 업데이트 중 오류:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    data, 
    isReady, 
    legendState, 
    handleBrushSelected, // Keep handleBrushSelected dependency
    onBrushSelected, 
    isRealtime,
    isSSR,
    // mergedConfig, 
    // serviceThresholdsMap // Add if needed
  ]);
  
  // 테마 변경 시 차트 재초기화
  useEffect(() => {
    if (!isReady || !chartInstanceRef.current || isSSR) return;
    
    // 테마 변경 시 차트 재초기화
    const timer = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      try {
        initChart();
      } catch (error) {
        console.error("테마 변경 시 차트 재초기화 오류:", error);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [currentTheme, initChart, isReady, isSSR]);
  
  return {
    chartContainerRef,
    chartHeight: mergedConfig.height,
    isLoading,
    isReady,
    isSSR,
    setIsLoading
  };
}

export default useChartRenderer;