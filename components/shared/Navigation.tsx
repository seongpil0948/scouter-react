// components/shared/Navigation.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@heroui/button";
import { Activity, BarChart2, List, Clock } from "lucide-react";
import { siteConfig } from "@/config/site";

const Navigation: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    {
      name: "대시보드",
      href: "/",
      icon: <BarChart2 size={18} />,
    },
    {
      name: "트레이스",
      href: "/traces",
      icon: <Activity size={18} />,
    },
    {
      name: "로그",
      href: "/logs",
      icon: <List size={18} />,
    },
  ];

  return (
    <div className="rounded-lg shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Clock size={24} className="text-primary mr-2" />
          <h1 className="text-xl font-semibold">{siteConfig.name}</h1>
        </div>

        <div className="flex gap-2">
          {navItems.map((item) => (
            <Button
              key={item.href}
              as={Link}
              href={item.href}
              variant={pathname === item.href ? "solid" : "light"}
              color={pathname === item.href ? "primary" : "default"}
              startContent={item.icon}
            >
              {item.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Navigation;
