/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,

  // The site never uses Next.js image resizing, so the /_next/image endpoint is switched off.
  images: { unoptimized: true },

  // The site is the static files in public/. The front page is public/index.html, served at "/"
  // with the address staying "/". beforeFiles runs before Next.js looks for a page or a file.
  async rewrites() {
    return {
      beforeFiles: [{ source: '/', destination: '/index.html' }],
    }
  },

  // The one security header the site's local Python server sends on every response.
  // No Content-Security-Policy: the pages use inline scripts and styles.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }],
      },
    ]
  },
}

module.exports = nextConfig
