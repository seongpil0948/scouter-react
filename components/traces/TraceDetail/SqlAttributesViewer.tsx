"use client";

import React, { useMemo } from "react";
import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import { Copy, CheckIcon } from "lucide-react";
import { addToast } from "@heroui/toast";
import { formatDuration } from "@/lib/utils/dateFormatter";

interface SqlAttributesViewerProps {
  attributes: Record<string, any> | undefined;
  className?: string;
}

const SqlAttributesViewer: React.FC<SqlAttributesViewerProps> = ({
  attributes,
  className = "",
}) => {
  // SQL 관련 속성 추출
  const sqlAttributes = useMemo(() => {
    if (!attributes) return null;

    // SQL 관련 키들을 찾아서 모음
    const sqlKeys = Object.keys(attributes).filter(
      (key) =>
        key.startsWith("sql.") || key.includes("sql") || key.includes("query")
    );

    if (sqlKeys.length === 0) return null;

    // 결과 객체 생성
    const result: Record<string, any> = {};
    sqlKeys.forEach((key) => {
      result[key] = attributes[key];
    });

    return result;
  }, [attributes]);

  // SQL 실행 시간 (밀리초)
  const sqlElapsed = useMemo(() => {
    if (!attributes) return null;
    return attributes["sql.elapsed"] || attributes["db.elapsed"] || null;
  }, [attributes]);

  // SQL 쿼리 추출
  const sqlQuery = useMemo(() => {
    if (!attributes) return null;
    return attributes["sql.query"] || attributes["db.statement"] || null;
  }, [attributes]);

  // SQL 쿼리 복사
  const handleCopySql = () => {
    if (!sqlQuery) return;

    navigator.clipboard
      .writeText(String(sqlQuery))
      .then(() => {
        addToast({
          title: "SQL 복사 완료",
          description: "SQL 쿼리가 클립보드에 복사되었습니다",
          color: "success",
        });
      })
      .catch(() => {
        addToast({
          title: "복사 실패",
          description: "클립보드 접근에 실패했습니다",
          color: "danger",
        });
      });
  };

  // SQL 속성이 없는 경우
  if (!sqlAttributes || Object.keys(sqlAttributes).length === 0) {
    return (
      <div className={`${className} p-4 text-center   rounded-md`}>
        <p className="text-gray-500">이 스팬에는 SQL 관련 속성이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={`${className}   rounded-lg overflow-hidden`}>
      <div className="border-b ">
        <div className="px-4 py-3  flex justify-between items-center">
          <div className="font-medium flex items-center">
            <span>SQL 쿼리</span>
            {sqlElapsed && (
              <Badge color="primary" className="ml-2">
                실행 시간: {formatDuration(Number(sqlElapsed))}
              </Badge>
            )}
          </div>

          {sqlQuery && (
            <Button size="sm" variant="ghost" onPress={handleCopySql}>
              <Copy size={16} className="mr-1" />
              복사
            </Button>
          )}
        </div>

        {sqlQuery ? (
          <div className="p-4 overflow-auto max-h-96">
            <pre className="font-mono text-sm whitespace-pre-wrap  p-3 rounded-md border">
              {String(sqlQuery)}
            </pre>
          </div>
        ) : (
          <div className="p-4 text-center">
            <p className="text-gray-500">SQL 쿼리 정보가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 기타 SQL 관련 속성 표시 */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          SQL 관련 정보
        </h4>
        <div className="space-y-2">
          {Object.entries(sqlAttributes)
            .filter(([key]) => key !== "sql.query" && key !== "sql.elapsed")
            .map(([key, value]) => (
              <div key={key} className="flex items-start border-b  pb-2">
                <div className="w-1/3 text-sm text-gray-600 dark:text-gray-400">
                  {key}:
                </div>
                <div className="w-2/3 font-mono text-sm break-all">
                  {typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value)}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default SqlAttributesViewer;
