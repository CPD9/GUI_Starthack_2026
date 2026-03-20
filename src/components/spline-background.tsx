"use client";

import { useEffect, useState } from "react";
import { SparkledBackground } from "@/components/sparkled";

interface SplineBackgroundProps {
  className?: string;
}

export function SplineBackground({ className }: SplineBackgroundProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`absolute inset-0 z-10 overflow-hidden ${className ?? ""}`} />;
  }

  // Always use white for particles
  const particleColor = "255, 255, 255";

  return (
    <div className={`absolute inset-0 z-10 overflow-hidden flex items-center justify-start pointer-events-none ${className ?? ""}`}>
      <SparkledBackground 
        position="inline"
        dotCount={1500}
        reactRadius={200}
        sphereRadius={150}
        width={400}
        height={400}
        particleColor={particleColor}
        globalMouseTracking={true}
      />
    </div>
  );
}
