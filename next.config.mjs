/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Admin uploads go to Cloudinary; legacy media still resolves from public/.
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
    unoptimized: true,
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
