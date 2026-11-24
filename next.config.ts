import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  ...(process.env.NODE_ENV === "development" ? { experimental: { cpus: 2 } } : {}),
};

export default withPWA(nextConfig);
