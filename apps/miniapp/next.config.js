/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@nui-ba-den/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'tuusgppjfkcijoneojrg.supabase.co' },
    ],
  },
};

module.exports = nextConfig;
