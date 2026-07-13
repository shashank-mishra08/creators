/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Local assets for now. When media moves to a CDN/CMS, add the host here.
    remotePatterns: [],
  },
  // Keep the Prisma client + pg driver out of the bundler (server-only natives).
  experimental: {
    serverComponentsExternalPackages: [
      "@prisma/client",
      "@prisma/adapter-pg",
      "pg",
    ],
  },
};

export default nextConfig;
