import type { NextConfig } from "next";
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig: NextConfig = {
  turbopack: {
    // Prevent Next.js from incorrectly inferring the workspace root when
    // multiple lockfiles exist (repo root + apps/web).
    root: __dirname,
  },
};

export default nextConfig;
