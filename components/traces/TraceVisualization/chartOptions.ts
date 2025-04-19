import * as echarts from 'echarts';
import { getServiceThreshold } from './utils';

/**
 * 차트 툴팁 포맷터 생성 함수
 */
export function createTooltipFormatter(
  data: any,
  serviceThresholds: Map<string, number>,
  latencyThreshold: number,
  colors: Record<string, string>
) {
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
      latencyThreshold
    );
    
    // Threshold ratio calculation
    const thresholdRatio = latency / serviceThreshold;
    const ratioText = `${(thresholdRatio * 100).toFixed(1)}%`;
    
    // Color determination
    const errorColor = colors?.error || "#ff4d4f";
    const warningColor = colors?.high || "#faad14";
    const normalColor = colors?.medium || "#1890ff";
    
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
}

/**
 * 차트 기본 옵션 생성 함수
 */
export function generateChartOptions(
  data: any,
  legendState: { normal: boolean; highLatency: boolean },
  config: any,
  currentTheme: string,
  serviceThresholds: Map<string, number>,
  isRealtime: boolean
): echarts.EChartsOption {
  const {
    title: chartTitle,
    colors,
    symbolSizes,
    brush: brushConfig
  } = config;
  
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
      formatter: createTooltipFormatter(data, serviceThresholds, config.latencyThreshold, colors)
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
        start: isRealtime ? 100 - Math.min(100, 100 * (5 / (config.realtimeRange || 5))) : 0,
        end: 100,
        zoomLock: isRealtime,
        filterMode: "filter",
        realtime: true,
        throttle: 100,
        rangeMode: ['value', 'value']
      },
      {
        start: isRealtime ? 100 - Math.min(100, 100 * (5 / (config.realtimeRange || 5))) : 0,
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
        const windowSize = (config.realtimeRange || 5) * 60 * 1000;
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
            config.latencyThreshold
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
              config.latencyThreshold
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
            config.latencyThreshold
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
}
