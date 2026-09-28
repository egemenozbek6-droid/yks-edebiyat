/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: Vercel + Capacitor (Android) için
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

export default nextConfig
