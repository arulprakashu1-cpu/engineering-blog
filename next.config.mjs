/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // isomorphic-dompurify pulls in jsdom, which has dynamic requires that
    // Next's bundler can't trace — bundling it breaks the serverless function
    // at runtime (the post page 500s). Marking it external resolves it from
    // node_modules at runtime instead.
    serverComponentsExternalPackages: ["isomorphic-dompurify", "jsdom"],
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
