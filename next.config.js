/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable strict mode for better development experience
  reactStrictMode: true,
  
  // Ensure proper handling of environment variables
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || '',
  },
  
  // Enable source maps in production for better debugging
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;

