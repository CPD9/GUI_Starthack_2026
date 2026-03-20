import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Landing page is now available at "/" 
  // Authenticated users should navigate to "/chat" from there
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
