/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["sman1madiun.sch.id"],
  },
  serverExternalPackages: ["firebase-admin", "jose", "jwks-rsa"],
};

module.exports = nextConfig;
