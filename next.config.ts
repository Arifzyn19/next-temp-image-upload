import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '30mb', // Increase the body size limit for server actions
    },
  },
  images: {
    domains: [
      "wyqbxnmjqnjlvxmeqoqa.supabase.co",
    ],
  },
};

export default nextConfig;