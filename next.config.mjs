/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Allow document uploads through Server Actions (default cap is 1MB).
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  images: {
    // Allow cover images from any HTTPS host. Tighten this to specific
    // hostnames in production if you want stricter control.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
