/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure module resolution stays within this app folder even when the repo
  // contains other lockfiles/package.json files above this directory.
  outputFileTracingRoot: __dirname,
  turbopack: {
    // Prevent Next.js from incorrectly inferring the workspace root when
    // multiple lockfiles exist (repo root + apps/web).
    root: __dirname,
  },
};

module.exports = nextConfig;
