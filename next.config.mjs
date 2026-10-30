/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // fully static: deploy to any host/CDN, fastest on slow networks
  images: { unoptimized: true }, // images are pre-optimized to WebP by scripts/optimize.mjs
  reactStrictMode: true,
};
export default nextConfig;
