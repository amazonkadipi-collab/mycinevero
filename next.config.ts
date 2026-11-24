import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: false },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org', port: '', pathname: '/t/p/**' },
    ],
  },
  async headers() {
    const cdnCacheHeaders = [
      {
        key: 'Vercel-CDN-Cache-Control',
        value: 's-maxage=300, stale-while-revalidate=3600',
      },
    ];
    return ['/movie', '/series', '/anime'].map(source => ({
      source,
      headers: cdnCacheHeaders,
    }));
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  webpack: (config, { dev }) => {
    if (dev && process.env.DISABLE_HMR === 'true') config.watchOptions = { ignored: /.*/ };
    return config;
  },
};

export default nextConfig;
