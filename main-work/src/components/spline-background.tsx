"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SparkledBackground } from "@/components/sparkled";

interface SplineBackgroundProps {
  className?: string;
}

export function SplineBackground({ className }: SplineBackgroundProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`absolute inset-0 z-0 overflow-hidden ${className ?? ""}`} />;
  }

  const isDark = resolvedTheme === "dark";

  // Always use white for particles
  const particleColor = "255, 255, 255";
  const glowColor = "255, 255, 255";

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden ${className ?? ""}`}>
      <SparkledBackground 
        key={isDark ? "dark" : "light"}
        position="fullscreen"
        dotCount={1500}
        reactRadius={200}
        sphereRadius={150}
        particleColor={particleColor}
        glowColor={glowColor}
      />
    </div>
  );
}
