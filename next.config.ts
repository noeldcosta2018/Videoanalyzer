import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
    "ffmpeg-static",
  ],
  experimental: {
    after: true,
  },
};

export default nextConfig;
