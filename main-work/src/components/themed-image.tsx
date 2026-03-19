"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface ThemedImageProps {
  lightSrc: string;
  darkSrc: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}

export const ThemedImage = ({
  lightSrc,
  darkSrc,
  alt,
  width,
  height,
  className,
  priority = false,
}: ThemedImageProps) => {
  return (
    <>
      {/* Light mode image - hidden in dark mode */}
      <Image
        src={lightSrc}
        alt={alt}
        width={width}
        height={height}
        className={cn(className, "dark:hidden block")}
        priority={priority}
      />
      {/* Dark mode image - hidden in light mode */}
      <Image
        src={darkSrc}
        alt={alt}
        width={width}
        height={height}
        className={cn(className, "hidden dark:block")}
        priority={priority}
      />
    </>
  );
};
