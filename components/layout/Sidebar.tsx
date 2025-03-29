"use client";
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@heroui/button";

import Navigation from "./Navigation";

import useUIStore from "@/lib/store/uiStore";

const Sidebar: React.FC = () => {
  const { isSidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-20 ${
        isSidebarOpen ? "w-64" : "w-16"
      }`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className="flex items-center">
          {isSidebarOpen ? (
            <>
              <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold">APM</span>
              </div>
              <span className="ml-2 font-semibold text-gray-800">
                텔레메트리
              </span>
            </>
          ) : (
            <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold">APM</span>
            </div>
          )}
        </div>
        <Button
          isIconOnly
          className="rounded-full p-1"
          variant="ghost"
          onPress={toggleSidebar}
        >
          {isSidebarOpen ? (
            <ChevronLeft size={20} />
          ) : (
            <ChevronRight size={20} />
          )}
        </Button>
      </div>

      <div className="py-4">
        <Navigation />
      </div>
    </aside>
  );
};

export default Sidebar;
