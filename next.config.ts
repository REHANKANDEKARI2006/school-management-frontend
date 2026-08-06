import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    const isProd = process.env.NODE_ENV === 'production';
    const rawBackendUrl = isProd 
      ? (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://school-management-backend-production-2fbb.up.railway.app")
      : "http://localhost:5000";
    const backendUrl = rawBackendUrl.endsWith('/api') ? rawBackendUrl.slice(0, -4) : rawBackendUrl;
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;