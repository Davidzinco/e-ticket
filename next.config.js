/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sman1madiun.sch.id",
      },
      {
        protocol: "https",
        hostname: "*.b-cdn.net",
      },
    ],
  },
  serverExternalPackages: ["firebase-admin", "jose", "jwks-rsa"],
};

module.exports = nextConfig;
