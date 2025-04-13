import { Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenuToggle, NavbarMenu, NavbarMenuItem } from '@heroui/navbar';
import DateRangePicker from '@/components/shared/DateRangePicker';
import { ThemeSwitch } from '@/components/shared/theme-switch';

export const NavTrace = (props: { handleTimeRangeChange: (startTime: number, endTime: number) => void }) => {
  const { handleTimeRangeChange } = props;
  return (
    <Navbar>
      <NavbarBrand>IDS APM</NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem>
          <DateRangePicker onChange={handleTimeRangeChange} />
        </NavbarItem>
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem className="hidden lg:flex">
          <ThemeSwitch className="absolute top-4 right-4" />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
};

export default NavTrace;
