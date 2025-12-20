/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Prevent Next.js from incorrectly inferring the workspace root when
    // multiple lockfiles exist (repo root + apps/web).
    root: __dirname,
  },
};

module.exports = nextConfig;
