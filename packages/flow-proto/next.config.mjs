/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The frozen token sheet lives at ../../design/tokens.css (single source of truth,
  // imported into app/globals.css). transpilePackages not needed — glass is local.
};

export default nextConfig;
