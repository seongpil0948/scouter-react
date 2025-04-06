"use client";

import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useTheme } from 'next-themes';
import { DEFAULT_CONFIG } from './constant';
import useECharts from './hook/useEchart';
import { EChartsOption } from 'echarts';

const TraceChart: React.FC<TraceChartProps> = React.memo(({
  data,
  height = 400,
  config,
  onDataPointClick,
  loading = false,
  legendState,
  serviceThresholds
}) => {
  const { theme } = useTheme();
  const [ready, setReady] = useState(false);
  
  // 설정 병합
  const mergedConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config,
  }), [config]);
  
  // ECharts 훅 사용
  const { 
    chartContainerRef, 
    setOption, 
    on, 
    off,
    isReady 
  } = useECharts({
    theme: theme === 'dark' ? 'dark' : undefined
  });
  
  // 서비스별 임계값 계산 (Airflow는 10분, 그 외는 1초)
  const getServiceThreshold = useCallback((serviceName?: string) => {
    if (!serviceName) return 1000; // 기본값: 1초
    
    // 'Airflow'인 경우 10분
    if (serviceName.includes('Airflow')) {
      return 600000; // 10분 (밀리초)
    }
    
    // 그 외 서비스는 1초
    return 1000;
  }, []);

  // 차트 설정 생성
  const getChartOptions = useCallback(() => {
    const {
      title: chartTitle,
      colors,
      symbolSizes,
    } = mergedConfig;
    
    // 기본 색상 정의
    const errorColor = "#ff4d4f"; // 오류 상태 색상
    const warningColor = "#faad14"; // 주황색 (임계값 초과)
    const normalLowColor = "#52c41a"; // 낮은 지연 시간
    const normalMediumColor = "#1890ff"; // 중간 지연 시간
    
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
        top: 10,
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
        formatter: function (params: any) {
          if (!params.value || params.value.length < 2) {
            return "데이터 없음";
          }

          const timestamp = params.value[0];
          const latency = params.value[1];
          const date = new Date(timestamp);
          
          // 메타데이터 가져오기
          const metadata = data.metadataMap?.get(timestamp);
          const serviceName = metadata?.serviceName || "알 수 없음";
          const status = metadata?.status;
          
          // 서비스별 임계값 적용
          const serviceThreshold = getServiceThreshold(serviceName);
          
          // 임계값 초과 비율 계산
          const thresholdRatio = latency / serviceThreshold;
          const ratioText = `${(thresholdRatio * 100).toFixed(1)}%`;
          
          // 상태가 ERROR인 경우 빨간색, 아니면 임계값 초과 비율에 따른 색상
          const textColor = status === "ERROR" 
            ? errorColor 
            : (thresholdRatio >= 1.0 ? warningColor : normalMediumColor);

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
        }
      },
      toolbox: {
        show: true,
        feature: {
          dataZoom: {
            yAxisIndex: "none",
          },
          restore: {},
          saveAsImage: {},
        },
        right: 10,
        iconStyle: {
          borderColor: theme === "dark" ? "#666" : "#666",
          color: theme === "dark" ? "#ddd" : "#333",
        },
      },
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
        type: "time" as const,
        boundaryGap: false,
        name: "시간",
        nameLocation: "middle",
        nameGap: 30,
        nameTextStyle: {
          color: theme === "dark" ? "#fff" : undefined,
        },
        scale: true,
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
        type: "value" as const,
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
          large: true,
          largeThreshold: 100,
          progressive: 400,
          progressiveThreshold: 1000,
          progressiveRepaint: true,
          symbol: "circle",
          symbolSize: (value: number[]) => {
            if (!value || value.length < 2) return symbolSizes?.min || 8;
            
            const timestamp = value[0];
            const latency = value[1];
            
            // 메타데이터 가져오기
            const metadata = data.metadataMap?.get(timestamp);
            const serviceName = metadata?.serviceName;
            
            // 서비스별 임계값 적용
            const serviceThreshold = getServiceThreshold(serviceName);
            
            // 임계값 대비 비율에 따라 크기 조정
            const thresholdRatio = latency / serviceThreshold;
            const minSize = symbolSizes?.min || 8;
            const maxSize = symbolSizes?.max || 18;
            
            // 임계값 비율에 따라 크기 조정 (최대 크기까지)
            return minSize + Math.min(thresholdRatio * 10, maxSize - minSize);
          },
          itemStyle: {
            color: (params: any) => {
              if (!params.value || params.value.length < 2)
                return normalMediumColor;
              
              const timestamp = params.value[0];
              const latency = params.value[1];
              
              // 메타데이터 가져오기
              const metadata = data.metadataMap?.get(timestamp);
              const status = metadata?.status;
              const serviceName = metadata?.serviceName;
              
              // 상태가 ERROR인 경우 빨간색
              if (status === "ERROR") {
                return errorColor;
              }
              
              // 서비스별 임계값 적용
              const serviceThreshold = getServiceThreshold(serviceName);
              
              // 임계값 초과 비율에 따른 색상 결정
              const thresholdRatio = latency / serviceThreshold;
              
              if (thresholdRatio < 0.5) return normalLowColor;
              if (thresholdRatio < 0.8) return normalMediumColor;
              if (thresholdRatio < 1.0) return "#faad14";
              
              return warningColor;
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
            
            // 메타데이터 가져오기
            const metadata = data.metadataMap?.get(timestamp);
            const serviceName = metadata?.serviceName;
            
            // 서비스별 임계값 적용
            const serviceThreshold = getServiceThreshold(serviceName);
            
            // 임계값 대비 비율에 따라 크기 조정 (고지연 전용)
            const thresholdRatio = latency / serviceThreshold;
            const minSize = symbolSizes?.effectMin || 15;
            const maxSize = symbolSizes?.effectMax || 30;
            
            // 임계값 비율에 따라 크기 조정 (최대 크기까지)
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
                return warningColor;
              }
              
              const timestamp = params.value[0];
              
              // 메타데이터 가져오기
              const metadata = data.metadataMap?.get(timestamp);
              const status = metadata?.status;
              
              // 상태가 ERROR인 경우만 빨간색, 아닌 경우 주황색
              return status === "ERROR" ? errorColor : warningColor;
            },
            shadowBlur: 10,
            shadowColor: (params: any) => {
              if (!params.value || params.value.length < 2) {
                return "rgba(250, 173, 20, 0.5)";
              }
              
              const timestamp = params.value[0];
              const metadata = data.metadataMap?.get(timestamp);
              const status = metadata?.status;
              
              // 상태가 ERROR인 경우 빨간색 그림자, 아닌 경우 주황색 그림자
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
    } as EChartsOption;
  }, [mergedConfig, theme, data, legendState, getServiceThreshold]);
  
  // 차트 옵션 업데이트
  useEffect(() => {
    if (isReady && (data.timeSeriesData.length > 0 || data.highLatencyData.length > 0)) {
      // 약간의 지연을 두고 옵션 설정
      const timer = setTimeout(() => {
        setOption(getChartOptions());
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [isReady, data, getChartOptions, setOption]);
  
  // 클릭 이벤트 핸들러
  useEffect(() => {
    if (!isReady || !onDataPointClick) return;
    
    const handleClick = (params: any) => {
      if (params && params.value && Array.isArray(params.value) && params.value.length > 0) {
        const timestamp = params.value[0] as number;
        onDataPointClick(timestamp);
      }
    };
    
    // 클릭 이벤트 리스너 등록
    on('click', handleClick);
    
    // 클린업
    return () => {
      off('click', handleClick);
    };
  }, [isReady, onDataPointClick, on, off]);
  
  // 컴포넌트 초기 표시를 위한 준비 상태 설정
  useEffect(() => {
    if (isReady) {
      const timer = setTimeout(() => {
        setReady(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isReady]);
  
  // 차트 컨테이너 스타일
  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: typeof height === 'number' ? `${height}px` : height,
    opacity: ready ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out',
    position: 'relative'
  };
  
  return (
    <div className="relative w-full" style={{ height: typeof height === 'number' ? `${height}px` : height }}>
      {/* 로딩 오버레이 */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 dark:bg-gray-800 dark:bg-opacity-70 z-10">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            <p className="mt-4">데이터를 불러오는 중...</p>
          </div>
        </div>
      )}
      
      {/* 차트 컨테이너 */}
      <div ref={chartContainerRef} style={containerStyle} />
    </div>
  );
});

TraceChart.displayName = 'TraceChart';

export default TraceChart;