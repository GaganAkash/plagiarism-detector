/** @type {import('next').NextConfig} */
const nextConfig = {
  // ponytail: allow LAN IP access in dev to silence Next 15.5 cross-origin warning
  allowedDevOrigins: ["http://localhost:3000", "http://192.168.1.108:3000"],
};

module.exports = nextConfig;
