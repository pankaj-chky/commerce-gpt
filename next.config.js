/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: [
      "@pinecone-database/pinecone",
      "@ai-sdk/deepseek",
      "@ai-sdk/groq",
      "@ai-sdk/google",
      "@ai-sdk/openai",
      "ai",
      "openai",
      "pdfjs-dist",
    ],
  },
};

module.exports = nextConfig;
