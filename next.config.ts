import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: 'ik.imagekit.io'
      },
      {
        hostname: 'fastly.picsum.photos'
      },
      {
        hostname: 'picsum.photos'
      }
    ]
  }
};

export default nextConfig;
