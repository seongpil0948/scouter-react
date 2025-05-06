// components/shared/tables/BaseTable.tsx
"use client";

import React, { ReactNode } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  TableProps,
} from "@heroui/table";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { Card, CardBody } from "@heroui/card";

export interface BaseTableProps<T> {
  items: T[];
  columns: {
    key: string;
    label: ReactNode;
    className?: string;
    align?: TableProps["align"];
  }[];
  isLoading?: boolean;
  emptyContent?: ReactNode;
  renderRow: (item: T) => ReactNode;
  pagination?: {
    totalCount: number;
    currentPage: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
  tableProps?: Partial<TableProps>;
}

function BaseTable<T>({
  items,
  columns,
  isLoading = false,
  emptyContent = "데이터가 없습니다.",
  renderRow,
  pagination,
  tableProps,
}: BaseTableProps<T>) {
  // 페이지 수 계산
  const pageCount = pagination
    ? Math.ceil(pagination.totalCount / pagination.pageSize)
    : 0;

  return (
    <Card className="w-full">
      <CardBody className="p-0">
        <Table
          aria-label={tableProps?.["aria-label"] || "Data Table"}
          isHeaderSticky
          removeWrapper
          classNames={{
            base: "max-w-full",
            th: [
              "bg-default-100",
              "text-default-800",
              "border-b",
              "border-divider",
              "px-4",
              "py-3",
              "text-sm",
            ],
            td: ["p-4", "text-sm"],
            ...(tableProps?.classNames || {}),
          }}
          bottomContent={
            pagination && pageCount > 1 ? (
              <div className="flex justify-center py-4">
                <Pagination
                  showControls
                  showShadow
                  color="primary"
                  page={pagination.currentPage}
                  total={pageCount}
                  onChange={pagination.onPageChange}
                />
              </div>
            ) : null
          }
          {...tableProps}
        >
          <TableHeader>
            {columns.map((column) => (
              <TableColumn
                key={column.key}
                className={column.className}
                align={column.align}
              >
                {column.label}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody
            emptyContent={
              <div className="py-8 text-center text-gray-500">
                {isLoading ? "로딩 중..." : emptyContent}
              </div>
            }
            items={items}
            isLoading={isLoading}
            loadingContent={<Spinner />}
          >
            {renderRow as any}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}

export default BaseTable;
