/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable strict mode for better development experience
  reactStrictMode: true,
  
  // Ensure proper handling of environment variables
  // Default to clean production domain if not set in environment
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'https://spontaneity-engine.vercel.app',
  },
  
  // Enable source maps in production for better debugging
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;

