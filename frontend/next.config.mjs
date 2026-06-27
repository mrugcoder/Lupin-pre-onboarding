/** @type {import('next').NextConfig} */
const nextConfig = {
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        // Match paths with trailing slash
        source: "/api/:path*/",
        destination: "http://localhost:8000/:path*/",
      },
      {
        // Match paths without trailing slash
        source: "/api/:path*",
        destination: "http://localhost:8000/:path*",
      },
    ];
  },
};

export default nextConfig;
