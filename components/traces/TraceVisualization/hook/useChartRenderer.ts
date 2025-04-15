// components/traces/TraceVisualization/hook/useChartRenderer.ts
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import * as echarts from 'echarts';
import { useTheme } from 'next-themes';
import { useIsSSR } from '@react-aria/ssr';
import type { EChartsOption } from 'echarts';
import { DEFAULT_CHART_CONFIG, getServiceThreshold } from '../utils';
import { SelectedTraceData, BrushToolboxIconType } from '../types';

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
}: any) {
  // SSR 체크
  const isSSR = useIsSSR();
  
  // Refs
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const isInitializingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const prevSeriesDataRef = useRef<{ timeSeriesData: any[], highLatencyData: any[] } | null>(null);
  const prevRangeRef = useRef<{ min: number, max: number } | null>(null);
  
  // State
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
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
          chartInstanceRef.current.dispose();
        } catch (e) {
          console.error('Failed to dispose chart:', e);
        }
        chartInstanceRef.current = null;
      }
    };
  }, []);
  
  // Format chart tooltip
  const getTooltipFormatter = useCallback(() => {
    return function (params: any) {
      if (!params.value || params.value.length < 2) {
        return "데이터 없음";
      }

      const timestamp = params.value[0];
      const latency = params.value[1];
      const date = new Date(timestamp);
      
      // Get metadata
      const metadata = data.metadataMap?.get(timestamp);
      const serviceName = metadata?.serviceName || "알 수 없음";
      const status = metadata?.status;
      
      // Service-specific threshold
      const serviceThreshold = getServiceThreshold(
        serviceName,
        serviceThresholds,
        mergedConfig.latencyThreshold
      );
      
      // Threshold ratio calculation
      const thresholdRatio = latency / serviceThreshold;
      const ratioText = `${(thresholdRatio * 100).toFixed(1)}%`;
      
      // Color determination
      const errorColor = mergedConfig.colors?.error || "#ff4d4f";
      const warningColor = mergedConfig.colors?.high || "#faad14";
      const normalColor = mergedConfig.colors?.medium || "#1890ff";
      
      const textColor = status === "ERROR" 
        ? errorColor 
        : (thresholdRatio >= 1.0 ? warningColor : normalColor);

      return `
        <div style="font-weight: bold; margin-bottom: 5px;">
          ${date.toLocaleDateString()} ${date.toLocaleTimeString()}
        </div>
        <div style="margin-bottom: 5px;">
          <span>서비스:</span>
          <span style="font-weight: bold; margin-left: 4px;">${serviceName}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>지연 시간:</span>
          <span style="font-weight: bold; color: ${textColor}">
            ${latency.toFixed(2)}ms (임계값의 ${ratioText})
          </span>
        </div>
        ${status ? `
        <div style="margin-top: 5px;">
          <span>상태:</span>
          <span style="font-weight: bold; color: ${status === "ERROR" ? errorColor : "inherit"}">
            ${status}
          </span>
        </div>
        ` : ''}
      `;
    };
  }, [data.metadataMap, serviceThresholds, mergedConfig]);
  
  // 브러시 이벤트 핸들러
  const handleBrushSelected = useCallback((params: any) => {
    if (!onBrushSelected || !data.metadataMap) return;
    
    // 선택된 데이터를 저장할 배열
    const selectedData: SelectedTraceData[] = [];
    
    // batch가 존재하고 배열인지 확인
    if (!params.batch || !Array.isArray(params.batch) || params.batch.length === 0) {
      return;
    }
    
    // 각 배치 처리
    params.batch.forEach((batchItem: any) => {
      // selected 배열이 존재하는지 확인
      if (!batchItem.selected || !Array.isArray(batchItem.selected)) {
        return;
      }
      
      // 각 시리즈 데이터 처리
      batchItem.selected.forEach((selection: any) => {
        // 시리즈 인덱스와 데이터 인덱스 가져오기
        const seriesIndex = selection.seriesIndex;
        const dataIndices = selection.dataIndex;
        
        // 데이터 인덱스가 비어있지 않은지 확인
        if (!dataIndices || !Array.isArray(dataIndices) || dataIndices.length === 0) {
          return;
        }
        
        // 해당 시리즈의 데이터 배열 가져오기
        const seriesData = seriesIndex === 0 ? data.timeSeriesData : data.highLatencyData;
        
        // 각 인덱스에 해당하는 데이터 처리
        dataIndices.forEach((index: number) => {
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
  
  // Get chart options
  const getChartOptions = useCallback((): echarts.EChartsOption => {
    const {
      title: chartTitle,
      colors,
      symbolSizes,
      brush: brushConfig
    } = mergedConfig;
    
    // 브러시 설정
    const brushOption = brushConfig?.enabled ? {
      brush: {
        toolbox: ['rect', 'polygon', 'lineX', 'lineY', 'keep', 'clear'],
        brushType: 'rect',
        brushMode: 'multiple',
        throttleType: 'debounce',
        throttleDelay: 300,
        transformable: true,
        brushStyle: {
          borderWidth: 1,
          color: currentTheme === "dark" ? 'rgba(100,100,100,0.15)' : 'rgba(0,0,0,0.1)',
          borderColor: currentTheme === "dark" ? 'rgba(150,150,150,0.35)' : 'rgba(0,0,0,0.3)',
        },
        removeOnClick: false
      }
    } : {};
    
    // 기본 옵션
    return {
      animation: !isRealtime,
      animationDuration: isRealtime ? 0 : 300,
      animationDurationUpdate: isRealtime ? 0 : 300,
      title: {
        text: chartTitle,
        left: "center",
        textStyle: currentTheme === "dark" ? { color: "#fff" } : undefined,
      },
      legend: {
        data: ["일반 요청", "고지연 요청"],
        right: 10,
        top: 30,
        selected: {
          "일반 요청": legendState.normal,
          "고지연 요청": legendState.highLatency,
        },
      },
      tooltip: {
        show: true,
        trigger: "item",
        backgroundColor: currentTheme === "dark" ? "rgba(50,50,50,0.9)" : "rgba(255,255,255,0.9)",
        borderColor: currentTheme === "dark" ? "#333" : "#ccc",
        textStyle: { color: currentTheme === "dark" ? "#fff" : "#333" },
        extraCssText: "box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);",
        formatter: getTooltipFormatter()
      },
      toolbox: {
        show: true,
        feature: {
          brush: { 
            type: ['rect', 'polygon', 'lineX', 'lineY', 'keep', 'clear'],
            title: {
              rect: '사각형 선택',
              polygon: '다각형 선택',
              lineX: 'X축 선택',
              lineY: 'Y축 선택',
              keep: '선택 유지',
              clear: '선택 초기화'
            }
          },
          dataZoom: { 
            yAxisIndex: "none",
            title: { zoom: '확대', back: '되돌리기' }
          },
          restore: { title: '초기화' },
          saveAsImage: { title: '이미지로 저장' },
        },
        right: 10,
        iconStyle: {
          borderColor: currentTheme === "dark" ? "#666" : "#666",
          color: currentTheme === "dark" ? "#ddd" : "#333",
        },
      },
      // 브러시 옵션은 여기서 확장
      ...brushOption,
      dataZoom: [
        {
          type: "inside",
          start: isRealtime ? 100 - Math.min(100, 100 * (5 / (mergedConfig.realtimeRange || 5))) : 0,
          end: 100,
          zoomLock: isRealtime,
          filterMode: "filter",
          realtime: true,
          throttle: 100,
          rangeMode: ['value', 'value']
        },
        {
          start: isRealtime ? 100 - Math.min(100, 100 * (5 / (mergedConfig.realtimeRange || 5))) : 0,
          end: 100,
          bottom: 10,
          height: 20,
          borderColor: currentTheme === "dark" ? "#444" : "#ddd",
          textStyle: {
            color: currentTheme === "dark" ? "#fff" : undefined,
          },
          fillerColor: currentTheme === "dark" ? "rgba(80,80,80,0.3)" : "rgba(200,200,200,0.3)",
          filterMode: "filter",
          realtime: true,
          throttle: 100,
          rangeMode: ['value', 'value'],
          labelFormatter: (value: number) => {
            const date = new Date(value);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          }
        },
      ],
      xAxis: {
        type: "time",
        name: "시간",
        nameLocation: "middle",
        nameGap: 30,
        nameTextStyle: {
          color: currentTheme === "dark" ? "#fff" : undefined,
        },
        axisLabel: {
          formatter: (value: number) => new Date(value).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          show: true,
          color: currentTheme === "dark" ? "#ccc" : undefined,
        },
        axisLine: {
          lineStyle: {
            color: currentTheme === "dark" ? "#444" : "#ccc",
          },
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: "dashed",
            opacity: currentTheme === "dark" ? 0.2 : 0.3,
            color: currentTheme === "dark" ? "#444" : "#ddd",
          },
        },
        min: (value: { min: number; max: number }) => {
          if (!isRealtime || !value.min) return value.min;
          
          const now = Date.now();
          const windowSize = (mergedConfig.realtimeRange || 5) * 60 * 1000;
          return now - windowSize;
        },
        max: (value: { min: number; max: number }) => {
          if (!isRealtime) return value.max;
          return Date.now();
        },
        animation: true,
        animationDurationUpdate: 300,
        animationEasingUpdate: 'linear'
      },
      yAxis: {
        type: "value",
        name: "지연 시간 (ms)",
        nameLocation: "middle",
        nameGap: 40,
        nameTextStyle: {
          color: currentTheme === "dark" ? "#fff" : undefined,
        },
        min: 0,
        scale: true,
        axisLabel: {
          show: true,
          color: currentTheme === "dark" ? "#ccc" : undefined,
        },
        axisLine: {
          lineStyle: {
            color: currentTheme === "dark" ? "#444" : "#ccc",
          },
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: "dashed",
            opacity: currentTheme === "dark" ? 0.2 : 0.3,
            color: currentTheme === "dark" ? "#444" : "#ddd",
          },
        },
      },
      grid: {
        left: "5%",
        right: "5%",
        bottom: "15%",
        top: "15%",
        containLabel: true,
      },
      series: [
        {
          name: "일반 요청",
          type: "scatter",
          progressive: 200,
          progressiveThreshold: 500,
          progressiveRepaint: true,
          animationDelay: (idx: number) => {
            return isRealtime ? 0 : idx * 5;
          },
          symbolSize: (value: number[]) => {
            if (!value || value.length < 2) return symbolSizes?.min || 8;
            
            const timestamp = value[0];
            const latency = value[1];
            
            // Get metadata
            const metadata = data.metadataMap?.get(timestamp);
            const serviceName = metadata?.serviceName;
            
            // Service threshold
            const serviceThreshold = getServiceThreshold(
              serviceName,
              serviceThresholds,
              mergedConfig.latencyThreshold
            );
            
            // Size based on threshold ratio
            const thresholdRatio = latency / serviceThreshold;
            const minSize = symbolSizes?.min || 8;
            const maxSize = symbolSizes?.max || 18;
            
            return minSize + Math.min(thresholdRatio * 10, maxSize - minSize);
          },
          itemStyle: {
            color: (params: any) => {
              if (!params.value || params.value.length < 2) {
                return colors?.medium || "#1890ff";
              }
              
              const timestamp = params.value[0];
              const latency = params.value[1];
              
              // Get metadata
              const metadata = data.metadataMap?.get(timestamp);
              const status = metadata?.status;
              const serviceName = metadata?.serviceName;
              
              // Service threshold
              const serviceThreshold = getServiceThreshold(
                serviceName,
                serviceThresholds,
                mergedConfig.latencyThreshold
              );
              
              // Error status gets priority
              if (status === "ERROR") {
                return colors?.error || "#ff4d4f";
              }
              
              // Color based on threshold ratio
              const thresholdRatio = latency / serviceThreshold;
              
              if (thresholdRatio < 0.5) return colors?.low || "#52c41a";
              if (thresholdRatio < 0.8) return colors?.medium || "#1890ff";
              if (thresholdRatio < 1.0) return colors?.high || "#faad14";
              
              return colors?.critical || "#ff4d4f";
            },
            opacity: 0.8,
            shadowBlur: 5,
            shadowColor: "rgba(0, 0, 0, 0.2)",
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              borderWidth: 2,
            },
          },
          data: legendState.normal ? data.timeSeriesData : [],
        },
        {
          name: "고지연 요청",
          type: "effectScatter",
          symbol: "circle",
          showEffectOn: 'render',
          rippleEffect: {
            brushType: "stroke",
            scale: isRealtime ? 2.5 : 4,
            period: isRealtime ? 5 : 4
          },
          animationDelay: (idx: number) => {
            return isRealtime ? 0 : idx * 10;
          },
          symbolSize: (value: number[]) => {
            if (!value || value.length < 2) return symbolSizes?.effectMin || 15;
            
            const timestamp = value[0];
            const latency = value[1];
            
            // Get metadata
            const metadata = data.metadataMap?.get(timestamp);
            const serviceName = metadata?.serviceName;
            
            // Service threshold
            const serviceThreshold = getServiceThreshold(
              serviceName,
              serviceThresholds,
              mergedConfig.latencyThreshold
            );
            
            // Size based on threshold ratio for highlight points
            const thresholdRatio = latency / serviceThreshold;
            const minSize = symbolSizes?.effectMin || 15;
            const maxSize = symbolSizes?.effectMax || 30;
            
            return minSize + Math.min(thresholdRatio * 8, maxSize - minSize);
          },
          itemStyle: {
            color: (params: any) => {
              if (!params.value || params.value.length < 2) {
                return colors?.high || "#faad14";
              }
              
              const timestamp = params.value[0];
              
              // Get metadata
              const metadata = data.metadataMap?.get(timestamp);
              const status = metadata?.status;
              
              // Error status gets error color, otherwise warning color
              return status === "ERROR" 
                ? (colors?.error || "#ff4d4f") 
                : (colors?.critical || "#ff4d4f");
            },
            shadowBlur: 10,
            shadowColor: (params: any) => {
              if (!params.value || params.value.length < 2) {
                return "rgba(250, 173, 20, 0.5)";
              }
              
              const timestamp = params.value[0];
              const metadata = data.metadataMap?.get(timestamp);
              const status = metadata?.status;
              
              // Error status gets more intense shadow
              return status === "ERROR" 
                ? "rgba(255, 77, 79, 0.7)" 
                : "rgba(250, 173, 20, 0.5)";
            }
          },
          emphasis: {
            scale: true,
          },
          data: legendState.highLatency ? data.highLatencyData : [],
        },
      ],
    } as any;
  }, [
    mergedConfig, 
    currentTheme, 
    data, 
    legendState, 
    serviceThresholds, 
    getTooltipFormatter,
    isRealtime
  ]);
  
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
      // const initOptions: echarts.InitOptions = {
      const initOptions: any = {
        renderer: 'canvas',
        devicePixelRatio: window.devicePixelRatio,
        useDirtyRect: true,
        locale: 'KO'
      };
      
      // 새 차트 인스턴스 생성
      const instance = echarts.init(
        chartContainerRef.current,
        currentTheme === "dark" ? "dark" : undefined,
        initOptions
      );
      
      chartInstanceRef.current = instance;
      
      // 차트 옵션 설정
      const options = getChartOptions();
      instance.setOption(options);
      
      // 브러시 선택 이벤트 리스너 등록
      if (onBrushSelected) {
        instance.on('brushselected', handleBrushSelected);
      }
      
      // 클릭 이벤트 핸들러 등록
      if (onDataPointClick) {
        instance.on('click', function (params) {
          if (params && params.value && Array.isArray(params.value) && params.value.length > 0) {
            onDataPointClick(params.value[0]);
          }
        });
      }
      
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
          chartInstanceRef.current.off('brushselected');
          chartInstanceRef.current.off('click');
          
          try {
            chartInstanceRef.current.dispose();
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
    getChartOptions, 
    handleBrushSelected, 
    onBrushSelected, 
    onDataPointClick
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
      
      // 차트 업데이트 전에 이벤트 리스너 명시적 등록 확인
      if (onBrushSelected) {
        chartInstanceRef.current.off('brushselected');
        chartInstanceRef.current.on('brushselected', handleBrushSelected);
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
          const prevOption = chartInstanceRef.current.getOption();
          console.log(">>> prevOption.xAxis: ", prevOption.xAxis);
          const prevXAxis = (prevOption.xAxis as any[])?.[0] || {};
          const prevMinTime = prevXAxis.min as number;
          const prevMaxTime = prevXAxis.max as number;
          
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
          prevRangeRef.current = {
            min: newMinTime,
            max: newMaxTime
          };
          
          // 현재 데이터 저장
          prevSeriesDataRef.current = {
            timeSeriesData: [...(data.timeSeriesData || [])],
            highLatencyData: [...(data.highLatencyData || [])]
          };
          
          // 업데이트 옵션 생성
          const updateOption = {
            series: [
              { 
                // 기본 series는 항상 배열의 첫 번째 요소여야 함
                name: "일반 요청",
                type: "scatter",
                data: legendState.normal ? data.timeSeriesData : [],
                // 증분 업데이트 설정
                progressive: 200,
                progressiveThreshold: 500,
                animation: !isRealtime,
              },
              { 
                // highlight series는 항상 배열의 두 번째 요소여야 함
                name: "고지연 요청",
                type: "effectScatter",
                data: legendState.highLatency ? data.highLatencyData : [],
                animation: !isRealtime,
              },
            ],
            xAxis: {
              min: newMinTime,
              max: newMaxTime,
              // 애니메이션 설정
              animation: isRealtime,
              animationDurationUpdate: 300,
              animationEasingUpdate: 'linear'
            },
            yAxis: {
              min: 0,
              max: maxLatency,
              animation: false
            },
            // 차트 업데이트 시 트랜지션 설정
            transition: isRealtime ? ['xAxis'] : [],
            // notMerge: false 설정으로 부분 업데이트만 적용
          };
          
          // 차트 인스턴스 업데이트
          chartInstanceRef.current.setOption(updateOption, {
            notMerge: false,
            replaceMerge: ['series'],
            lazyUpdate: true,
            silent: isRealtime // 실시간 모드에서는 불필요한 이벤트 발생 최소화
          });
        }
      } else {
        // 데이터가 없는 경우 빈 시리즈 설정
        chartInstanceRef.current.setOption({
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
          notMerge: false
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
    handleBrushSelected, 
    onBrushSelected, 
    isRealtime,
    isSSR
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