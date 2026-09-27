/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: Vercel + Capacitor (Android) için
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // TODO: tip hataları temizlenince false yap
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
