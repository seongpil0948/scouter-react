import React from "react";
import { Card, CardBody } from "@heroui/card";
import { CircularProgress } from "@heroui/progress";

interface LoadingCardProps {
  message?: string;
}

export default function LoadingCard({
  message = "로딩 중...",
}: LoadingCardProps) {
  return (
    <Card>
      <CardBody className="flex flex-col items-center justify-center p-12">
        <CircularProgress aria-label={message} />
        <p className="mt-4 text-gray-500">{message}</p>
      </CardBody>
    </Card>
  );
}
