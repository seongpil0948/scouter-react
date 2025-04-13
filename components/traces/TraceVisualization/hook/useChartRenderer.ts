import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import * as echarts from 'echarts';
import { useTheme } from 'next-themes';
import { debounce } from 'lodash-es';
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
  // Refs
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const isInitializingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  
  // State
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Theme
  const { theme } = useTheme();
  
  // Merged configuration
  const mergedConfig = {
    ...DEFAULT_CHART_CONFIG,
    ...config,
  };
  
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
  
  // 브러시 이벤트 핸들러 - 완전히 다시 작성된 버전
  const handleBrushSelected = useCallback((params: any) => {
    console.log('Brush event triggered!', JSON.stringify(params, null, 2));
    
    if (!onBrushSelected || !data.metadataMap) return;
    
    // 선택된 데이터를 저장할 배열
    const selectedData: SelectedTraceData[] = [];
    
    // batch가 존재하고 배열인지 확인
    if (!params.batch || !Array.isArray(params.batch) || params.batch.length === 0) {
      console.log('Invalid batch data in brush event');
      return;
    }
    
    // 각 배치 처리
    params.batch.forEach((batchItem: any) => {
      // selected 배열이 존재하는지 확인
      if (!batchItem.selected || !Array.isArray(batchItem.selected)) {
        console.log('No selected data in batch item');
        return;
      }
      
      // 각 시리즈 데이터 처리
      batchItem.selected.forEach((selection: any) => {
        // 시리즈 인덱스와 데이터 인덱스 가져오기
        const seriesIndex = selection.seriesIndex;
        const dataIndices = selection.dataIndex;
        
        console.log(`Processing series ${seriesIndex} with indices:`, dataIndices);
        
        // 데이터 인덱스가 비어있지 않은지 확인
        if (!dataIndices || !Array.isArray(dataIndices) || dataIndices.length === 0) {
          console.log(`No data indices for series ${seriesIndex}`);
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
              console.log(`Found data point at index ${index}:`, timestamp, latency, metadata.traceItem.traceId);
              
              selectedData.push({
                timestamp,
                latency,
                serviceName: metadata.serviceName || '',
                status: metadata.status,
                traceId: metadata.traceItem.traceId,
                name: metadata.traceItem.name,
                traceItem: metadata.traceItem
              });
            } else {
              console.log(`No metadata found for timestamp ${timestamp}`);
            }
          } else {
            console.log(`Index ${index} out of range for series ${seriesIndex}`);
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
    
    console.log('Selected data processed:', uniqueSelectedData.length, 'items');
    
    // 선택된 데이터가 있으면 콜백 호출
    if (uniqueSelectedData.length > 0) {
      console.log('Calling onBrushSelected with data');
      onBrushSelected(uniqueSelectedData);
    } else {
      console.log('No data selected after processing');
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
          color: theme === "dark" ? 'rgba(100,100,100,0.15)' : 'rgba(0,0,0,0.1)',
          borderColor: theme === "dark" ? 'rgba(150,150,150,0.35)' : 'rgba(0,0,0,0.3)',
        },
        removeOnClick: false
      }
    } : {};
    
    // 기본 옵션
    return {
      animation: true,
      title: {
        text: chartTitle,
        left: "center",
        textStyle: theme === "dark" ? { color: "#fff" } : undefined,
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
        backgroundColor: theme === "dark" ? "rgba(50,50,50,0.9)" : "rgba(255,255,255,0.9)",
        borderColor: theme === "dark" ? "#333" : "#ccc",
        textStyle: { color: theme === "dark" ? "#fff" : "#333" },
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
          borderColor: theme === "dark" ? "#666" : "#666",
          color: theme === "dark" ? "#ddd" : "#333",
        },
      },
      // 브러시 옵션은 여기서 확장
      ...brushOption,
      dataZoom: [
        {
          type: "inside",
          start: 0,
          end: 100,
          zoomLock: false,
          filterMode: "filter",
        },
        {
          start: 0,
          end: 100,
          bottom: 10,
          height: 20,
          borderColor: theme === "dark" ? "#444" : "#ddd",
          textStyle: {
            color: theme === "dark" ? "#fff" : undefined,
          },
          fillerColor: theme === "dark" ? "rgba(80,80,80,0.3)" : "rgba(200,200,200,0.3)",
          filterMode: "filter",
        },
      ],
      xAxis: {
        type: "time",
        name: "시간",
        nameLocation: "middle",
        nameGap: 30,
        nameTextStyle: {
          color: theme === "dark" ? "#fff" : undefined,
        },
        axisLabel: {
          formatter: (value: number) => new Date(value).toLocaleTimeString(),
          show: true,
          color: theme === "dark" ? "#ccc" : undefined,
        },
        axisLine: {
          lineStyle: {
            color: theme === "dark" ? "#444" : "#ccc",
          },
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: "dashed",
            opacity: theme === "dark" ? 0.2 : 0.3,
            color: theme === "dark" ? "#444" : "#ddd",
          },
        },
      },
      yAxis: {
        type: "value",
        name: "지연 시간 (ms)",
        nameLocation: "middle",
        nameGap: 40,
        nameTextStyle: {
          color: theme === "dark" ? "#fff" : undefined,
        },
        min: 0,
        scale: true,
        axisLabel: {
          show: true,
          color: theme === "dark" ? "#ccc" : undefined,
        },
        axisLine: {
          lineStyle: {
            color: theme === "dark" ? "#444" : "#ccc",
          },
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: "dashed",
            opacity: theme === "dark" ? 0.2 : 0.3,
            color: theme === "dark" ? "#444" : "#ddd",
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
          progressive: 1000,          
          progressiveThreshold: 5000, 
          progressiveRepaint: true,
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
          showEffectOn: "render",
          rippleEffect: {
            brushType: "stroke",
            scale: 4,
            period: 4
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
      ] as any, // series 타입 에러 방지를 위해 any로 처리
    } as any;
  }, [
    mergedConfig, 
    theme, 
    data, 
    legendState, 
    serviceThresholds, 
    getTooltipFormatter
  ]);
  
  // Initialize chart instance
  const initChart = useCallback(() => {
    // Guard conditions
    if (isInitializingRef.current || !isMountedRef.current || !chartContainerRef.current) {
      return null;
    }
    
    try {
      isInitializingRef.current = true;
      
      // Dispose previous instance
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.dispose();
          chartInstanceRef.current = null;
        } catch (error) {
          console.error("Failed to dispose chart:", error);
        }
      }
      
      // Create new chart
      if (!isMountedRef.current || !chartContainerRef.current) {
        return null;
      }
      
      const chartInstance = echarts.init(
        chartContainerRef.current,
        theme === "dark" ? "dark" : undefined,
      );
      
      chartInstanceRef.current = chartInstance;
      
      // Set initial options
      chartInstance.setOption(getChartOptions());
      
      // 브러시 선택 이벤트 리스너 등록 - 여기서 명시적 추가
      chartInstance.off('brushselected');
      chartInstance.on('brushselected', handleBrushSelected);
      
      // 클릭 이벤트 핸들러 등록
      if (onDataPointClick) {
        chartInstance.off('click');
        chartInstance.on('click', function (params) {
          if (params && params.value && Array.isArray(params.value) && params.value.length > 0) {
            const timestamp = params.value[0] as number;
            onDataPointClick(timestamp);
          }
        });
      }
      
      return chartInstance;
    } catch (error) {
      console.error("Error initializing chart:", error);
      return null;
    } finally {
      isInitializingRef.current = false;
    }
  }, [theme, getChartOptions, handleBrushSelected, onDataPointClick]);
  
  // Handle resize
  const handleResize = useMemo(() => 
    debounce(() => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.resize();
      }
    }, 250), 
  []);
  
  // Initialize chart on mount
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    // Initialize chart with slight delay
    const initTimer = setTimeout(() => {
      initChart();
      setIsReady(true);
    }, 100);
    
    // Add resize listener
    window.addEventListener("resize", handleResize);
    
    return () => {
      clearTimeout(initTimer);
      window.removeEventListener("resize", handleResize);
      handleResize.cancel();
    };
  }, [initChart, handleResize]);
  
  // Update chart when data or config changes
  useEffect(() => {
    if (!chartInstanceRef.current || !isReady) return;
    
    try {
      setIsLoading(true);
      
      // 차트 업데이트 전에 이벤트 리스너 명시적 등록 확인
      if (onBrushSelected) {
        chartInstanceRef.current.off('brushselected');
        chartInstanceRef.current.on('brushselected', handleBrushSelected);
      }
      
      // Update chart options
      chartInstanceRef.current.setOption({
        series: [
          { 
            data: legendState.normal ? data.timeSeriesData : [],
          },
          { 
            data: legendState.highLatency ? data.highLatencyData : [],
          },
        ],
      });
      
      // Auto adjust axis ranges if data available
      if (data.timeSeriesData.length > 0 || data.highLatencyData.length > 0) {
        const allPoints = [
          ...data.timeSeriesData,
          ...data.highLatencyData,
        ];
        
        if (allPoints.length > 0) {
          // Calculate time axis range
          const timestamps = allPoints.map(point => point[0]);
          const minTime = Math.min(...timestamps);
          const maxTime = Math.max(...timestamps);
          
          // Calculate latency axis range with margin
          const latencies = allPoints.map(point => point[1]);
          const maxLatency = Math.max(...latencies, 1) * 1.2; // 20% margin
          
          // Set axis ranges
          chartInstanceRef.current.setOption({
            xAxis: { min: minTime, max: maxTime },
            yAxis: { min: 0, max: maxLatency },
          });
        }
      }
    } catch (error) {
      console.error("Error updating chart:", error);
    } finally {
      setIsLoading(false);
    }
  }, [data, isReady, legendState, handleBrushSelected, onBrushSelected]);
  
  // Update for theme changes
  useEffect(() => {
    if (!isReady || !chartInstanceRef.current) return;
    
    // Delay theme update to ensure DOM is ready
    const themeTimer = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      try {
        // Reinitialize chart with new theme
        initChart();
      } catch (error) {
        console.error("Error updating chart theme:", error);
      }
    }, 100);
    
    return () => clearTimeout(themeTimer);
  }, [theme, initChart, isReady]);
  
  return {
    chartContainerRef,
    chartHeight: mergedConfig.height,
    isLoading,
    isReady,
    setIsLoading
  };
}

export default useChartRenderer;