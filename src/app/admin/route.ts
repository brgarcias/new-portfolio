// The content panel (Decap CMS). It is a route, not a file in public/, so
// it gets the security headers of next.config.mjs: Netlify serves the files
// in public/ straight from its CDN, without them. Decap itself, and its
// config.yml, stay in public/admin. panel.js loads first: it adapts Decap
// (signed commits, the status of the pull requests) and then starts it.
export const dynamic = 'force-static';

const page = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Painel de conteúdo | Bruno Garcia</title>
    <link rel="icon" href="/favicon/favicon-32x32.png" type="image/png" />
    <link href="/admin/config.yml" type="text/yaml" rel="cms-config-url" />
    <link rel="stylesheet" href="/admin/panel.css" />
  </head>
  <body>
    <script src="/admin/panel.js"></script>
    <script src="/admin/cms/decap-cms.js"></script>
  </body>
</html>
`;

export function GET() {
  return new Response(page, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
