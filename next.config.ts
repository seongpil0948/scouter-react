import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: "/apm",
  experimental: {
    typedEnv: true,
  },
  // reactStrictMode: false,
  cleanDistDir: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  sassOptions: {
    includePaths: [path.join(__dirname, "styles")],
  },

  async rewrites() {
    return [
      {
        source: `/api/telemetry/:path*`,
        destination: `http://localhost:8080/api/telemetry/:path*`,
      },
    ];
  },
};

export default nextConfig;
