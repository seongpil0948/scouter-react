import type { Metadata } from "next";

import { Inter } from "next/font/google";

import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OpenTelemetry APM 대시보드",
  description: "애플리케이션 성능 모니터링 대시보드",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-gray-100">
          <Sidebar />
          <div className="flex-1 relative ml-16 lg:ml-64">
            <main className="pt-16 px-4 pb-4">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
