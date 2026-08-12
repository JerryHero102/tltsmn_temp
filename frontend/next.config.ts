import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://api.thieulamtaysonmiennam.id.vn/api/:path*",
      },
    ];
  },
};

export default nextConfig;
