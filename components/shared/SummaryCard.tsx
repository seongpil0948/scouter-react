import React from "react";
import { Card, CardBody } from "@heroui/card";

interface SummaryCardProps {
  title: string;
  value: React.ReactNode;
  badge?: React.ReactNode;
}

export default function SummaryCard({ title, value, badge }: SummaryCardProps) {
  return (
    <Card className="w-full">
      <CardBody className="flex flex-col items-center justify-center">
        <div className="text-sm text-gray-500">{title}</div>
        <div className="text-3xl font-bold mt-2 flex items-center">
          {value}
          {badge && <span className="ml-2">{badge}</span>}
        </div>
      </CardBody>
    </Card>
  );
}
