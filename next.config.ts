import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    // Next.js-ийн upgrade агент зөвхөн аюулгүй байдлын шинэчлэлтийг санал болгоно
    agentUpgrade: "security",
  },
  // Home хавтас дахь өөр lockfile-ийг root гэж андуурахаас сэргийлнэ
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
