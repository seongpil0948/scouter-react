// frontend/app/api/telemetry/logs/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      isHealthy: true,
    },
    { status: 200 }
  );
}
