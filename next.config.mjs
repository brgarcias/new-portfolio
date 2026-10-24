// Next.js bootstraps each page with inline scripts whose content changes on
// every build, so scripts need 'unsafe-inline'. Nonces would require
// rendering the page on every request. HeroUI and framer-motion set inline
// styles, and the development server also needs 'unsafe-eval'.
const isDevelopment = process.env.NODE_ENV === 'development';
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keeps `next dev` from appending its own agent instructions to AGENTS.md.
  agentRules: false,
  poweredByHeader: false,
  reactStrictMode: true,
  // The pages read content/, and the size of the images it names, when they
  // are generated on the server: the home page once a day, and the 404
  // pages, which share its layout, on request.
  outputFileTracingIncludes: {
    '/**': ['content/**/*.json', 'public/images/**/*'],
  },
  // English, the default language, lives at / without a prefix: / serves
  // the /en page, and /en itself sends visitors to /.
  async redirects() {
    return [{ source: '/en', destination: '/', permanent: true }];
  },
  async rewrites() {
    return { beforeFiles: [{ source: '/', destination: '/en' }] };
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
