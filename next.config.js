/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // 静态资源目录
  assetPrefix: '',
  // 环境变量
  env: {
    BASE_URL: process.env.BASE_URL,
  },
  // 图片优化配置
  images: {
    domains: ['localhost'],
  },
};

export default nextConfig;