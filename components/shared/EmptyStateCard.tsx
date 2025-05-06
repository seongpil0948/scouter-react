import React from "react";
import { Card, CardBody } from "@heroui/card";

interface EmptyStateCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function EmptyStateCard({
  icon,
  title,
  subtitle,
}: EmptyStateCardProps) {
  return (
    <Card>
      <CardBody className="flex items-center justify-center p-12">
        <div className="text-center text-gray-500">
          {icon}
          <p>{title}</p>
          {subtitle && <p className="text-sm mt-2">{subtitle}</p>}
        </div>
      </CardBody>
    </Card>
  );
}
