"use client";
import React from "react";
import { Moon, Sun, Bell } from "lucide-react";
import { Button } from "@heroui/button";

import DateRangePicker from "../shared/DateRangePicker";

import useUIStore from "@/lib/store/uiStore";

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { isDarkMode, toggleDarkMode, isSidebarOpen } = useUIStore();

  return (
    <header
      className={`fixed top-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-10 right-0 transition-all ${
        isSidebarOpen ? "left-64" : "left-16"
      }`}
    >
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>

      <div className="flex items-center space-x-4">
        <DateRangePicker />

        <Button
          isIconOnly
          className="rounded-full"
          variant="ghost"
          onPress={toggleDarkMode}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </Button>

        <Button isIconOnly className="rounded-full relative" variant="ghost">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
