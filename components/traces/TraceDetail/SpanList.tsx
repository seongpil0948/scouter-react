"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@heroui/button";
import { Badge, BadgeProps } from "@heroui/badge";
import { EyeIcon, SearchIcon } from "lucide-react";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Card, CardHeader, CardBody } from "@heroui/card";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";

interface Span {
  id: string;
  name: string;
  serviceName: string;
  startTime: number;
  endTime: number;
  duration: number;
  parentSpanId?: string;
  attributes?: Record<string, any>;
  status?: string;
  traceId: string;
  spanId: string;
}

interface SpanListProps {
  spans: Span[];
  formatDuration: (duration: number) => string;
  setSelectedSpanId: (spanId: string) => void;
}

export const SpanList: React.FC<SpanListProps> = React.memo(
  ({ spans, formatDuration, setSelectedSpanId }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [serviceFilter, setServiceFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("duration");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Extract unique services for filtering
    const services = useMemo(() => {
      const serviceSet = new Set<string>();
      spans.forEach((span) => serviceSet.add(span.serviceName));
      return Array.from(serviceSet).sort();
    }, [spans]);

    // Filter and sort spans
    const filteredSpans = useMemo(() => {
      let result = spans;

      // Search term filtering
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        result = result.filter(
          (span) =>
            span.name.toLowerCase().includes(lowerSearchTerm) ||
            span.serviceName.toLowerCase().includes(lowerSearchTerm)
        );
      }

      // Status filtering
      if (statusFilter !== "all") {
        result = result.filter((span) => span.status === statusFilter);
      }

      // Service filtering
      if (serviceFilter !== "all") {
        result = result.filter((span) => span.serviceName === serviceFilter);
      }

      // Sort results
      result = [...result].sort((a, b) => {
        let compareResult = 0;

        switch (sortBy) {
          case "name":
            compareResult = a.name.localeCompare(b.name);
            break;
          case "service":
            compareResult = a.serviceName.localeCompare(b.serviceName);
            break;
          case "status":
            compareResult = (a.status || "").localeCompare(b.status || "");
            break;
          case "duration":
          default:
            compareResult = a.duration - b.duration;
            break;
        }

        return sortOrder === "asc" ? compareResult : -compareResult;
      });

      return result;
    }, [spans, searchTerm, statusFilter, serviceFilter, sortBy, sortOrder]);

    // Handle sort column click
    const toggleSort = (field: string) => {
      if (sortBy === field) {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      } else {
        setSortBy(field);
        setSortOrder("desc");
      }
    };

    // Get sort indicator
    const getSortIndicator = (field: string) => {
      if (sortBy === field) {
        return sortOrder === "asc" ? " ↑" : " ↓";
      }
      return "";
    };

    // Get status color for badge
    const getStatusColor = (status?: string): BadgeProps["color"] => {
      switch (status) {
        case "ERROR":
          return "danger";
        case "OK":
          return "success";
        default:
          return "default";
      }
    };

    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Span List</h3>
        </CardHeader>

        <CardBody>
          <div className="mb-4 flex flex-wrap gap-3">
            {/* Search input */}
            <div className="flex-1 min-w-[200px]">
              <Input
                startContent={
                  <SearchIcon className="text-gray-400" size={16} />
                }
                placeholder="Search span name or service..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Status filter */}
            <div className="w-auto">
              <Select
                aria-label="Status filter"
                value={statusFilter}
                onSelectionChange={(key) => setStatusFilter(key as string)}
                className="min-w-[150px]"
              >
                <SelectItem key="all">All Statuses</SelectItem>
                <SelectItem key="OK">Success</SelectItem>
                <SelectItem key="ERROR">Error</SelectItem>
                <SelectItem key="UNSET">Unset</SelectItem>
              </Select>
            </div>

            {/* Service filter */}
            <div className="w-auto">
              <Select
                aria-label="Service filter"
                value={serviceFilter}
                onSelectionChange={(key) => setServiceFilter(key as string)}
                className="min-w-[150px]"
              >
                <SelectItem key="all">All Services</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service}>{service}</SelectItem>
                )) as any}
              </Select>
            </div>
          </div>

          {/* Span table */}
          <Table
            aria-label="Span list"
            removeWrapper
            className="max-h-96 overflow-y-auto"
          >
            <TableHeader>
              <TableColumn
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort("name")}
              >
                Name{getSortIndicator("name")}
              </TableColumn>
              <TableColumn
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort("service")}
              >
                Service{getSortIndicator("service")}
              </TableColumn>
              <TableColumn
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort("status")}
              >
                Status{getSortIndicator("status")}
              </TableColumn>
              <TableColumn
                className="cursor-pointer hover:bg-gray-100 text-right"
                onClick={() => toggleSort("duration")}
              >
                Latency{getSortIndicator("duration")}
              </TableColumn>
              <TableColumn align="center">Action</TableColumn>
            </TableHeader>
            <TableBody
              emptyContent={
                <div className="text-center py-8 text-gray-500">
                  No spans match your search criteria
                </div>
              }
            >
              {filteredSpans.map((span) => (
                <TableRow key={span.spanId} className="hover:bg-gray-50">
                  <TableCell className="font-mono text-sm">
                    {span.name}
                  </TableCell>
                  <TableCell>{span.serviceName}</TableCell>
                  <TableCell>
                    <Badge color={getStatusColor(span.status)}>
                      {span.status || "UNSET"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatDuration(span.duration)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      title="View span details"
                      variant="ghost"
                      isIconOnly
                      onPress={() => setSelectedSpanId(span.spanId)}
                    >
                      <EyeIcon size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    );
  }
);

SpanList.displayName = "SpanList";
