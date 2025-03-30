'use client';
import React from 'react';
import { Moon, Sun, Bell } from 'lucide-react';
import { Button } from '@heroui/button';
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@heroui/navbar';
import DateRangePicker from '../shared/DateRangePicker';

import useUIStore from '@/lib/store/uiStore';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { isSidebarOpen } = useUIStore();

  return (
    <Navbar
      classNames={{
        base: `transition-all fixed top-0 h-16  ${isSidebarOpen ? 'left-64' : 'left-16'} z-10`,
        wrapper: 'max-w-full',
        content: 'ml-48',
      }}
    >
      <NavbarBrand className="text-xl font-semibol text-foreground-800 max-w-48">{title}</NavbarBrand>
      <NavbarContent justify="start">
        <DateRangePicker />
      </NavbarContent>
    </Navbar>
  );
};

export default Header;
