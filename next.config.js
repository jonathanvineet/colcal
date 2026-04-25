const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fix workspace root detection when multiple lockfiles exist
  outputFileTracingRoot: path.join(__dirname),
}

module.exports = nextConfig
