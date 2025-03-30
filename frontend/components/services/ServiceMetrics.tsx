"use client";
import React, { useEffect, useRef, useCallback } from "react";
import * as echarts from "echarts";
import { Card, CardBody } from "@heroui/card";
import { ServiceMetric } from "@/lib/store/telemetryStore";

interface ServiceMetricsProps {
  service: ServiceMetric;
  height?: number | string;
}

const ServiceMetrics: React.FC<ServiceMetricsProps> = ({
  service,
  height = 500,
}) => {
  const chartRefLatency = useRef<HTMLDivElement>(null);
  const chartRefRequests = useRef<HTMLDivElement>(null);
  const chartRefError = useRef<HTMLDivElement>(null);
  
  const chartInstanceLatency = useRef<echarts.ECharts | null>(null);
  const chartInstanceRequests = useRef<echarts.ECharts | null>(null);
  const chartInstanceError = useRef<echarts.ECharts | null>(null);

  // 시간대별 데이터 준비
  const prepareTimeSeriesData = useCallback(() => {
    if (!service.timeSeriesData || service.timeSeriesData.length === 0) {
      return {
        timestamps: [],
        latencyData: [],
        requestData: [],
        errorRateData: [],
      };
    }

    // 시간 기준 정렬
    const sortedData = [...service.timeSeriesData].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    const timestamps = sortedData.map((data) => new Date(data.timestamp));
    const latencyData = sortedData.map((data) => data.avgLatency);
    const requestData = sortedData.map((data) => data.requestCount);
    const errorRateData = sortedData.map((data) => data.errorRate);

    return {
      timestamps,
      latencyData,
      requestData,
      errorRateData,
    };
  }, [service.timeSeriesData]);

  // 지연 시간 차트 초기화
  const initLatencyChart = useCallback(() => {
    if (!chartRefLatency.current) return;

    // 기존 인스턴스가 있다면 제거
    if (chartInstanceLatency.current) {
      chartInstanceLatency.current.dispose();
    }

    const chartInstance = echarts.init(chartRefLatency.current);
    chartInstanceLatency.current = chartInstance;

    const { timestamps, latencyData } = prepareTimeSeriesData();

    const option = {
      title: {
        text: "평균 응답 시간",
        left: "center",
      },
      tooltip: {
        trigger: "axis",
        formatter: function (params: any) {
          const timestamp = params[0].axisValue;
          const value = params[0].data;
          
          return `${timestamp}<br />${value < 1000 ? value.toFixed(2) + ' ms' : (value / 1000).toFixed(2) + ' s'}`;
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: timestamps,
        axisLabel: {
          formatter: function (value: any) {
            const date = new Date(value);
            return date.toLocaleTimeString();
          },
        },
      },
      yAxis: {
        type: "value",
        name: "응답 시간 (ms)",
        nameLocation: "middle",
        nameGap: 50,
        axisLabel: {
          formatter: function (value: number) {
            return value < 1000 ? value + ' ms' : (value / 1000).toFixed(1) + ' s';
          },
        },
      },
      series: [
        {
          name: "평균 응답 시간",
          type: "line",
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: "rgba(24, 144, 255, 0.8)",
                },
                {
                  offset: 1,
                  color: "rgba(24, 144, 255, 0.1)",
                },
              ],
            },
          },
          data: latencyData,
          lineStyle: {
            width: 3,
            color: "#1890ff",
          },
          itemStyle: {
            color: "#1890ff",
          },
          smooth: true,
        },
      ],
    };

    chartInstance.setOption(option);
    
    // 반응형 차트를 위한 리사이즈 이벤트 리스너
    const handleResize = () => {
      chartInstance.resize();
    };
    
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [prepareTimeSeriesData]);

  // 요청 수 차트 초기화
  const initRequestsChart = useCallback(() => {
    if (!chartRefRequests.current) return;

    // 기존 인스턴스가 있다면 제거
    if (chartInstanceRequests.current) {
      chartInstanceRequests.current.dispose();
    }

    const chartInstance = echarts.init(chartRefRequests.current);
    chartInstanceRequests.current = chartInstance;

    const { timestamps, requestData } = prepareTimeSeriesData();

    const option = {
      title: {
        text: "요청 수",
        left: "center",
      },
      tooltip: {
        trigger: "axis",
        formatter: function (params: any) {
          const timestamp = params[0].axisValue;
          const value = params[0].data;
          
          return `${timestamp}<br />${value.toLocaleString()} 요청`;
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: timestamps,
        axisLabel: {
          formatter: function (value: any) {
            const date = new Date(value);
            return date.toLocaleTimeString();
          },
        },
      },
      yAxis: {
        type: "value",
        name: "요청 수",
        nameLocation: "middle",
        nameGap: 50,
      },
      series: [
        {
          name: "요청 수",
          type: "bar",
          data: requestData,
          itemStyle: {
            color: "#52c41a",
          },
        },
      ],
    };

    chartInstance.setOption(option);
    
    // 반응형 차트를 위한 리사이즈 이벤트 리스너
    const handleResize = () => {
      chartInstance.resize();
    };
    
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [prepareTimeSeriesData]);

  // 오류율 차트 초기화
  const initErrorChart = useCallback(() => {
    if (!chartRefError.current) return;

    // 기존 인스턴스가 있다면 제거
    if (chartInstanceError.current) {
      chartInstanceError.current.dispose();
    }

    const chartInstance = echarts.init(chartRefError.current);
    chartInstanceError.current = chartInstance;

    const { timestamps, errorRateData } = prepareTimeSeriesData();

    const option = {
      title: {
        text: "오류율",
        left: "center",
      },
      tooltip: {
        trigger: "axis",
        formatter: function (params: any) {
          const timestamp = params[0].axisValue;
          const value = params[0].data;
          
          return `${timestamp}<br />${value.toFixed(2)}%`;
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: timestamps,
        axisLabel: {
          formatter: function (value: any) {
            const date = new Date(value);
            return date.toLocaleTimeString();
          },
        },
      },
      yAxis: {
        type: "value",
        name: "오류율 (%)",
        nameLocation: "middle",
        nameGap: 50,
        axisLabel: {
          formatter: "{value}%",
        },
        max: function (value: { max: number }) {
          return Math.max(value.max * 1.1, 5); // 최소 5% 스케일 보장
        },
      },
      series: [
        {
          name: "오류율",
          type: "line",
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: "rgba(255, 77, 79, 0.8)",
                },
                {
                  offset: 1,
                  color: "rgba(255, 77, 79, 0.1)",
                },
              ],
            },
          },
          data: errorRateData,
          lineStyle: {
            width: 3,
            color: "#ff4d4f",
          },
          itemStyle: {
            color: "#ff4d4f",
          },
          smooth: true,
        },
      ],
    };

    chartInstance.setOption(option);
    
    // 반응형 차트를 위한 리사이즈 이벤트 리스너
    const handleResize = () => {
      chartInstance.resize();
    };
    
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [prepareTimeSeriesData]);

  // 컴포넌트 마운트 시 차트 초기화
  useEffect(() => {
    const cleanupLatency = initLatencyChart();
    const cleanupRequests = initRequestsChart();
    const cleanupError = initErrorChart();

    return () => {
      // 컴포넌트 언마운트 시 차트 인스턴스 정리
      if (chartInstanceLatency.current) {
        chartInstanceLatency.current.dispose();
      }
      if (chartInstanceRequests.current) {
        chartInstanceRequests.current.dispose();
      }
      if (chartInstanceError.current) {
        chartInstanceError.current.dispose();
      }
      
      // 리사이즈 이벤트 리스너 정리
      if (cleanupLatency) cleanupLatency();
      if (cleanupRequests) cleanupRequests();
      if (cleanupError) cleanupError();
    };
  }, [initLatencyChart, initRequestsChart, initErrorChart, service]);

  // 서비스 성능 요약 정보
  const renderServiceSummary = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500 mb-1">총 요청 수</h3>
          <p className="text-2xl font-semibold">{service.requestCount.toLocaleString()}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500 mb-1">평균 응답 시간</h3>
          <p className="text-2xl font-semibold">
            {service.avgLatency < 1000 
              ? `${service.avgLatency.toFixed(2)} ms` 
              : `${(service.avgLatency / 1000).toFixed(2)} s`}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500 mb-1">오류 수</h3>
          <p className="text-2xl font-semibold">{service.errorCount.toLocaleString()}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500 mb-1">오류율</h3>
          <p className={`text-2xl font-semibold ${service.errorRate > 5 ? 'text-red-500' : 'text-green-500'}`}>
            {service.errorRate.toFixed(2)}%
          </p>
        </div>
      </div>
    );
  };

  // 시계열 데이터가 없을 때 표시할 내용
  const renderNoTimeSeriesData = () => {
    return (
      <div className="flex justify-center items-center h-52 bg-gray-50 border rounded-lg">
        <p className="text-gray-500">
          시계열 데이터가 없습니다. 더 많은 데이터가 수집되면 차트가 표시됩니다.
        </p>
      </div>
    );
  };

  const hasTimeSeriesData = service.timeSeriesData && service.timeSeriesData.length > 0;

  return (
    <div>
      {/* 서비스 성능 요약 */}
      {renderServiceSummary()}
      
      {/* 차트 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow">
          <CardBody>
            {hasTimeSeriesData ? (
              <div 
                ref={chartRefLatency} 
                style={{ 
                  height: typeof height === 'number' ? `${height / 3}px` : height 
                }}
              />
            ) : (
              renderNoTimeSeriesData()
            )}
          </CardBody>
        </Card>
        
        <Card className="shadow">
          <CardBody>
            {hasTimeSeriesData ? (
              <div 
                ref={chartRefRequests} 
                style={{ 
                  height: typeof height === 'number' ? `${height / 3}px` : height 
                }}
              />
            ) : (
              renderNoTimeSeriesData()
            )}
          </CardBody>
        </Card>
        
        <Card className="shadow">
          <CardBody>
            {hasTimeSeriesData ? (
              <div 
                ref={chartRefError} 
                style={{ 
                  height: typeof height === 'number' ? `${height / 3}px` : height 
                }}
              />
            ) : (
              renderNoTimeSeriesData()
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default ServiceMetrics;