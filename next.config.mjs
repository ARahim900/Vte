/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // No ESLint config/dependency is present in this project, so enabling the
    // build-time ESLint gate would fail the build ("ESLint must be installed").
    // Left disabled intentionally until an eslint config is added.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScript build gate is ON: type errors fail the production build.
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig