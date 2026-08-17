/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `next build` and `next dev` both write to `.next`, so building while the
  // dev server is up wipes the chunks it is serving and the page stops
  // hydrating — with no error to explain it. Set NEXT_DIST_DIR to give a
  // one-off build its own directory. Unset, nothing changes.
  distDir: process.env.NEXT_DIST_DIR || ".next",
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
