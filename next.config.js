/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        port: "",
        pathname: "/bhishman-desai/blogposts/main/images/**",
      },
    ],
  },
};

module.exports = nextConfig;
