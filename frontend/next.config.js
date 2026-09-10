/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Önálló (standalone) build a kis méretű production Docker image-hez.
  output: "standalone",

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },

  async rewrites() {
    // A böngészőből érkező /api és /uploads kérések a backendre mennek.
    // Élesben a Caddy reverse proxy már szétosztja ezeket, ez csak tartalék
    // (és a helyi `next dev`-hez kell). A BACKEND_URL futásidőben olvasódik.
    const api = process.env.BACKEND_URL || "http://localhost:4000";
    return [
      { source: "/api/:path*", destination: `${api}/api/:path*` },
      { source: "/uploads/:path*", destination: `${api}/uploads/:path*` },
    ];
  },
};

module.exports = nextConfig;
