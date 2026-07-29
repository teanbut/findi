/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Product photos are served from object storage (technical plan §2) —
  // add the real bucket/CDN hostname here once it's provisioned.
  images: { remotePatterns: [{ protocol: 'https', hostname: '**.findi.co.za' }] },
};

module.exports = nextConfig;
