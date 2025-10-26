import type { NextConfig } from "next";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
