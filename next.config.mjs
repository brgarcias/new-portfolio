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

// The content panel (Decap CMS, in public/admin) talks to GitHub's API,
// logs in through Netlify's GitHub provider, shows avatars and the
// repository's images, reads the images it uploads from blob: URLs, and
// compiles WebAssembly for its image tools. It also needs 'unsafe-eval':
// its config check (AJV) compiles code at run time. On localhost it can
// use decap-server, on port 8081.
const panelPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://avatars.githubusercontent.com https://raw.githubusercontent.com",
  "font-src 'self' data:",
  "connect-src 'self' blob: https://api.github.com https://api.netlify.com https://raw.githubusercontent.com http://localhost:8081",
  "frame-src 'self' blob:",
  "worker-src 'self' blob:",
  "media-src 'self' blob:",
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
  // are generated again on the server, once a day.
  outputFileTracingIncludes: {
    '/**': ['content/**/*.json', 'public/images/**/*'],
  },
  // The copy of the content for the tests is not needed in production.
  outputFileTracingExcludes: {
    '/**': ['tests/**/*'],
  },
  // English, the default language, lives at / without a prefix: / serves
  // the /en page, and /en itself sends visitors to /. The game, at /play,
  // works the same way.
  async redirects() {
    return [
      { source: '/en', destination: '/', permanent: true },
      { source: '/en/play', destination: '/play', permanent: true },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/', destination: '/en' },
        { source: '/play', destination: '/en/play' },
      ],
    };
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
      // Replaces the policy above on the panel's pages.
      {
        source: '/admin/:path*',
        headers: [{ key: 'Content-Security-Policy', value: panelPolicy }],
      },
    ];
  },
};

export default nextConfig;
