import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  pageExtensions: ["js", "jsx", "ts", "tsx"],
  // MDX support disabled in admin (not needed)
  // Use @next/mdx only in blog app
};

export default nextConfig;
