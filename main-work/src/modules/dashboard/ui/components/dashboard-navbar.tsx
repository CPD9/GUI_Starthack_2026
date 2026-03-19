"use client";

import { ThemedImage } from "@/components/themed-image";
import { ThemeToggle } from "@/components/theme-toggle";

export const DashboardNavbar = () => {
  return (
    <nav className="flex px-4 items-center py-3 bg-background">
      <div className="w-10" />
      <div className="flex-1 flex justify-center">
        <ThemedImage
          lightSrc="/Analytics-logo-light.png"
          darkSrc="/Analytics-logo-dark.png"
          width={120}
          height={40}
          alt="Analytics Logo"
          className="object-contain"
        />
      </div>
      <div className="flex items-center">
        <ThemeToggle />
      </div>
    </nav>
  );
};
