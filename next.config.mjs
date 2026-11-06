/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  serverExternalPackages: ["mongoose"],
  transpilePackages: ["date-fns"],
};

export default nextConfig;
