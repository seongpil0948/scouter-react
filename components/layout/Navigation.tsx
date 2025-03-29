"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart, List, Activity, Layers, Settings } from "lucide-react";

import useUIStore from "@/lib/store/uiStore";

interface NavigationItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  isSidebarOpen: boolean;
}

const NavigationItem: React.FC<NavigationItemProps> = ({
  href,
  label,
  icon,
  isActive,
  isSidebarOpen,
}) => {
  return (
    <Link
      className={`flex items-center py-2 px-4 rounded-md transition-colors ${
        isActive
          ? "bg-blue-100 text-blue-700"
          : "text-gray-700 hover:bg-gray-100"
      }`}
      href={href}
    >
      <span className="flex-shrink-0">{icon}</span>
      {isSidebarOpen && <span className="ml-3">{label}</span>}
    </Link>
  );
};

const Navigation: React.FC = () => {
  const pathname = usePathname();
  const { isSidebarOpen } = useUIStore();

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;

    return false;
  };

  const navItems = [
    { href: "/", label: "대시보드", icon: <BarChart size={20} /> },
    { href: "/services", label: "서비스 맵", icon: <Activity size={20} /> },
    { href: "/traces", label: "트레이스", icon: <Layers size={20} /> },
    { href: "/logs", label: "로그", icon: <List size={20} /> },
  ];

  return (
    <nav className="py-4">
      <ul className="space-y-2">
        {navItems.map((item) => (
          <li key={item.href}>
            <NavigationItem
              href={item.href}
              icon={item.icon}
              isActive={isActive(item.href)}
              isSidebarOpen={isSidebarOpen}
              label={item.label}
            />
          </li>
        ))}
      </ul>

      <div className="mt-8 pt-4 border-t border-gray-200">
        <ul className="space-y-2">
          <li>
            <NavigationItem
              href="/settings"
              icon={<Settings size={20} />}
              isActive={isActive("/settings")}
              isSidebarOpen={isSidebarOpen}
              label="설정"
            />
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
