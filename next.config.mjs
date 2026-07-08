/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
  },
  async redirects() {
    return [
      {
        source: "/runway",
        destination: "/modeling",
        permanent: true,
      },
    ];
  },
  async headers() {
    const immutableAssetHeaders = [
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ];

    return [
      {
        source: "/dorvell/optimized/:path*",
        headers: immutableAssetHeaders,
      },
      {
        source: "/dorvell/blur/:path*",
        headers: immutableAssetHeaders,
      },
      {
        source: "/dorvell-ferguson-symbol-v2.png",
        headers: immutableAssetHeaders,
      },
    ];
  },
};

export default nextConfig;
