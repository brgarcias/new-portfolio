# AGENTS.md

Instruções para agentes de código que trabalham neste repositório. O projeto é o portfólio profissional de Bruno Garcia, desenvolvedor full-stack. É um site de página única, em inglês, feito com Next.js 16 (App Router), React 19, TypeScript estrito, Tailwind CSS 3 e HeroUI, publicado no Netlify.

## Regra principal

O Bruno gosta do portfólio como ele é. Não mude a aparência nem o comportamento do site sem pedido explícito: cores, fontes, tamanhos, espaçamentos, animações, textos, ordem das seções e interações ficam como estão. Correções, atualizações de dependências e melhorias de desempenho e segurança precisam manter o resultado visual idêntico.

Os testes visuais de `tests/visual.spec.ts` garantem isso. Nunca regrave as imagens de `tests/snapshots/` para fazer um teste passar, a não ser que o pedido tenha sido justamente uma mudança visual. Nesse caso, confira cada imagem nova antes de versioná-la e diga no PR o que mudou.

## Ambiente

- Use Node.js 24.22.1, a versão do `.nvmrc`. Rode `nvm use` antes de qualquer comando e confira com `node --version`, porque o shell pode abrir em outra versão. Se cada comando abrir um shell novo, ative o Node no mesmo comando, como em `nvm use >/dev/null && pnpm check`. O `.npmrc` tem `engine-strict=true`, então outra versão do Node faz a instalação falhar.
- Use somente pnpm 11.3.0, via Corepack. Não use npm nem yarn para instalar dependências e não crie outros lockfiles. O único lockfile é o `pnpm-lock.yaml`.
- Instale com `pnpm install --frozen-lockfile`.
- O `pnpm-workspace.yaml` libera scripts de instalação apenas para `@heroui/shared-utils`, que copia a variante para React 19 na instalação, e para `unrs-resolver`. Ele também aceita ESLint 10 nos plugins que ainda declaram suporte só até a versão 9. Mantenha essas regras ao mexer em dependências.

## Comandos

| Comando           | O que faz                                                         |
| ----------------- | ----------------------------------------------------------------- |
| `pnpm dev`        | Servidor de desenvolvimento em <http://localhost:3000>.           |
| `pnpm check`      | ESLint sem avisos, verificação de tipos e checagem do Prettier.   |
| `pnpm format:fix` | Aplica a formatação do Prettier.                                  |
| `pnpm build`      | Build de produção.                                                |
| `pnpm test:e2e`   | Testes Playwright em desktop e celular sobre o build de produção. |

`pnpm test:e2e` sobe o servidor com `pnpm start` na porta 4173, então rode `pnpm build` antes. Para instalar o navegador, use `pnpm exec playwright install chromium`. Para usar um Chromium já instalado, defina `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

Antes de considerar uma mudança pronta, rode `pnpm check`, `pnpm build` e `pnpm test:e2e`, e confirme que tudo passa. O job `quality` do GitHub Actions, em `.github/workflows/ci.yml`, roda os mesmos comandos em cada PR para `main`.

`pnpm dev` e `pnpm build` usam o webpack de propósito. O Turbopack minifica o CSS com o Lightning CSS, que reescreve `translate3d(...)`, `scale3d(...)` e `rotate3d(...)` como transformações 2D. A geometria é a mesma, mas o navegador deixa de criar camadas próprias para esses elementos e passa a desenhar imagens reduzidas com outra filtragem. Não troque para o Turbopack sem comparar as imagens dos testes visuais.

## Estrutura

- `src/app/layout.tsx` define `lang="en"`, as classes `js csstransitions dark` no `<html>`, das quais dependem o CSS do template e o tema escuro do HeroUI, a fonte Inter, os metadados, os ícones de `public/favicon/`, o `Header` e os `Providers`. O primeiro script do `<head>` remove a quebra de linha que o Netlify injeta, junto com um comentário, logo depois do `<meta charset>` nas páginas de produção em `*.netlify.app`. Sem ele, o React 19 falha na hidratação (erro #418) e renderiza a página inteira de novo. Não remova esse script; um teste simula a injeção.
- `src/app/providers.tsx` envolve as seções no `HeroUIProvider`.
- `src/app/page.tsx` monta as seções nesta ordem: About Me, Professional Experience, Academic Education, Courses & Certifications, Projects, Contributing e Contact. Cada seção é um `div.page` dentro de `div.pages-stack`.
- `src/components/Header/` é o menu em pilha de páginas, adaptado de um template da Codrops. `load.ts` manipula o DOM diretamente: alterna `pages-stack--open`, `pages-nav--open`, `menu-button--open` e `page--inactive` e aplica transformações 3D inline em cada página. As transições terminam por `transitionend`. `content.ts` tem os links do menu e das redes sociais.
- `src/app/<seção>/` tem o componente da seção, os dados (`experiences.ts`, `sections.ts`, `courses.ts`, `projects.data.ts`, `contributing.ts`, `tabs.ts`) e o `styles.css` próprio.
- `src/components/Modal`, `Form` e `SnackBar` são o modal do HeroUI usado pelo feedback e pelos cursos, o formulário de feedback e o aviso de envio.
- `src/app/globals.css` tem as diretivas do Tailwind, o menu, a pilha de páginas, o cabeçalho das seções e a fonte de ícones `bpicons`.
- `src/app/not-found.tsx` (404), `src/app/error.tsx` (erro na página) e `src/app/global-error.tsx` (erro no próprio layout, com `<html>` e `<body>` próprios) usam `src/components/StatusPage`, no estilo dos cabeçalhos das seções: rótulo, título, descrição, citação e um botão redondo de ação. O menu de páginas só funciona na home, então fica oculto nessas páginas por regras no fim do `globals.css`. Essas regras ficam no `globals.css` porque um CSS importado pelo `not-found.tsx` seria pré-carregado, sem uso, em todas as páginas. O "Try again" da página de erro recarrega a página inteira, porque o `reset()` do Next não reconfiguraria o menu.
- O `Header` fica montado entre navegações no cliente, como o link da 404 para a home, então o menu é configurado de novo a cada mudança de rota (`usePathname`).
- `next.config.mjs` desliga o `agentRules`, esconde o `X-Powered-By` e define os cabeçalhos de segurança: Content Security Policy, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy`. A CSP só aceita recursos do próprio site. Não carregue scripts, estilos, fontes ou imagens de outros domínios. Se isso for inevitável, ajuste a política e explique o motivo no PR.
- `public/` guarda favicon, imagens, a fonte `bpicons`, o currículo em `documents/cv/Bruno_Garcia_Resume.zip` e `contact.html`, que declara o formulário para o Netlify Forms.
- `src/emails/feedback/index.html` é um modelo de e-mail do SendGrid mantido fora do build. O site não o usa e o Prettier o ignora.
- `tests/portfolio.spec.ts` tem os testes funcionais, `tests/visual.spec.ts` os testes visuais, `tests/helpers.ts` a navegação compartilhada e `tests/snapshots/` as imagens de referência.

O projeto usa o App Router. As seções são componentes de servidor quando não precisam de estado; os interativos têm `'use client'`.

## Conteúdo

- Todo texto visível do site é em inglês. Documentação, títulos e descrições de PRs e títulos de testes ficam em português.
- Nunca invente experiências, projetos, cursos, métricas, depoimentos ou datas. Se faltar uma informação, pergunte.
- As experiências ficam em `src/app/professional-experience/experiences.ts`, da mais recente para a mais antiga. Datas usam o formato `AAAA-MM`, e o período e a duração são calculados a partir delas. A experiência sem data de fim é a atual.
- Datas no formato `AAAA-MM` ou `AAAA-MM-DD` são lidas como meia-noite UTC, então todo cálculo e toda formatação de data usam UTC (`getUTCMonth`, `timeZone: 'UTC'`). Com o fuso local, um build feito no Brasil mostraria o mês anterior. Um teste confere os períodos.
- A duração do emprego atual e a idade na seção de contato dependem da data de hoje. Elas são calculadas a cada renderização, por `getExperiences()` e `getTabs()`, e a página inicial é regenerada uma vez por dia (`revalidate = 86400` em `src/app/page.tsx`). Não volte a calcular esses valores no nível do módulo, porque o servidor guarda o módulo carregado e os valores ficariam congelados.
- E-mail, WhatsApp, LinkedIn e GitHub aparecem em `src/components/Header/content.ts`, em `src/app/contact/tabs.ts` e no link do WhatsApp de `src/app/contact/index.tsx`. Ao trocar um contato, atualize todos os lugares e os testes.
- O currículo é `public/documents/cv/Bruno_Garcia_Resume.zip`, baixado por um link com `download`. Os testes conferem o nome do download e que o arquivo é um ZIP.
- O formulário de feedback envia os dados ao Netlify Forms, no formulário `contact`, com um `POST` para `public/contact.html`, o arquivo estático que o Netlify lê no deploy. Um `POST` para `/` chega ao servidor do Next.js, responde 200 e a mensagem se perde. O Netlify só aceita campos declarados em `contact.html`, então qualquer campo novo ou renomeado em `src/components/Form` precisa ser atualizado lá também; um teste confere isso. O campo `bot-field` é uma armadilha para robôs e fica vazio. Não adicione outros formulários, servidores de envio nem simulações de envio.
- O endereço oficial é <https://brgarcias-portfolio.netlify.app>, definido em `siteUrl`, em `src/app/site.ts`. Ele alimenta a URL canônica, o Open Graph, os dados estruturados `Person` de `src/app/layout.tsx`, o `robots.txt` (`src/app/robots.ts`) e o `sitemap.xml` (`src/app/sitemap.ts`), e também aparece em `package.json`. Ao trocar o domínio, atualize esses lugares e a propriedade do Search Console.
- Os dados estruturados `Person` só repetem fatos que a página já mostra: nome, cargo, e-mail, LinkedIn e GitHub. Mantenha-os em sincronia com o conteúdo.
- O site é verificado no Google Search Console como propriedade de prefixo do URL, pela meta tag `google-site-verification`, com o token em `verification.google` de `src/app/layout.tsx`. Não remova a tag. Uma propriedade do tipo Domínio só verifica por DNS e não funciona em `netlify.app`.

## Código

- TypeScript estrito, com `noUnusedLocals` e `noUnusedParameters`. O alias `@/` aponta para a raiz do repositório, então os imports são `@/src/...` e `@/public/...`.
- Siga o estilo do arquivo ao redor: componentes com exportação padrão, comentários de grupo nos imports (`// HOOKS`, `// FONTAWESOME`), nomes e classes em inglês.
- Prettier com aspas simples e vírgula final. Indentação de dois espaços e quebras de linha LF.
- Os estilos ficam no `styles.css` de cada seção e no `globals.css`, com as classes do template original. Não converta CSS para Tailwind, não reorganize as folhas de estilo e não troque valores por equivalentes "mais limpos": até mudanças de mesma geometria podem alterar a renderização. O Tailwind serve ao HeroUI e a poucas classes utilitárias.
- Ícones vêm do FontAwesome 6, com `@fortawesome/react-fontawesome`.
- Imagens são importadas estaticamente e exibidas com `next/image`, com `unoptimized`, e ficam em WebP dentro de `public/images/`. Capturas de tela, mockups e ilustrações usam WebP sem perdas, que mantém cada pixel do PNG original. Fotos usam WebP com qualidade 82 e lado menor de 1200 px, o bastante para os cartões em telas de alta densidade, mantendo o perfil de cor (as fotos de celular vêm em Display P3).
- Remova metadados, como localização, de qualquer foto antes de publicá-la. As fotos de contribuição tinham coordenadas GPS no EXIF. Uma forma de converter uma foto com o `sharp` é `sharp(origem).resize({ width: 1200 }).keepIccProfile().webp({ quality: 82, effort: 6 }).toFile(destino)`, que descarta o EXIF. Use `height` no lugar de `width` para fotos na horizontal.
- No celular, as páginas empilhadas ficam dentro da área de carregamento antecipado do navegador, e todas as imagens do site baixam na abertura da página. Mantenha as imagens leves.
- O projeto tem poucas dependências de produção. Evite adicionar novas e justifique no PR quando for necessário.
- Fontes são servidas pelo próprio projeto, pelo `next/font` ou por arquivos em `public/fonts/`. Não use CDNs de fontes, estilos ou scripts, que a CSP bloqueia.
- Não edite `next-env.d.ts`, que é gerado pelo Next.js. Não versione `.next/`, `test-results/`, `playwright-report/` nem `tsconfig.tsbuildinfo`.

### Versões que não devem subir sem cuidado

- **Tailwind CSS** fica na 3.4. A versão 4 muda o reset de estilos e o HeroUI 2.8 em diante exige a 4.
- **HeroUI** fica em `@heroui/react` 2.7.11, a última linha compatível com Tailwind 3. O `Modal` fixa `max-h-[calc(100%_-_7.5rem)]`, porque o HeroUI mudou esse limite para 8rem.
- **FontAwesome** fica na 6.x. A versão 7 redesenhou ícones e mudou a largura padrão.
- **Playwright**: a versão de `@playwright/test` precisa ser igual à tag do contêiner em `.github/workflows/ci.yml`. Ao atualizar, regrave as imagens dos testes visuais e confira que nada mudou além do esperado.

## Testes

Os testes de navegador são o contrato de qualidade do site. Eles exigem:

- Nenhum erro de JavaScript no carregamento e nenhuma rolagem horizontal.
- Menu que navega por todas as seções e fecha com Escape.
- Experiências que abrem e recolhem, etapas da formação, modal dos cursos, slider e detalhes dos projetos, cartões de contribuição e abas de contato funcionando.
- Download do currículo e links de contato corretos.
- Validação, aviso de sucesso e aviso de erro do formulário de feedback.
- Página 404 com status 404, `noindex`, menu oculto e link de volta, depois do qual o menu da home funciona.
- Páginas de erro que aparecem quando uma seção ou o layout falham (os testes simulam um navegador sem `IntersectionObserver` ou sem `AbortController`), com "Try again" que recupera o site.
- Cabeçalhos de segurança presentes e nenhuma violação da Content Security Policy ao navegar, abrir os modais e enviar o feedback.
- Aparência idêntica às imagens de `tests/snapshots/`, em desktop e em celular.

Os testes procuram textos visíveis, como títulos de seções e cargos. Se mudar esses textos a pedido, atualize os testes na mesma mudança. Nunca enfraqueça ou remova um teste para fazê-lo passar.

Os testes visuais só rodam no Linux, dentro do contêiner `mcr.microsoft.com/playwright:<versão>-noble` usado pelo CI, porque cada sistema desenha fontes de um jeito. No macOS e no Windows, `pnpm test:e2e` os ignora. Quando o CI falhar num teste visual, baixe o artefato `test-results` da execução com `gh run download` e examine as imagens `*-actual.png` e `*-diff.png`. Se a mudança não foi pedida, corrija o código. Se foi, copie cada `*-actual.png` para `tests/snapshots/<desktop|mobile>/`, com o nome sem o sufixo.

O Playwright grava a imagem de um teste visual novo e aprova o teste. Por isso o job compara `tests/snapshots/` antes e depois dos testes e falha no passo **Fail on new screenshots** até que a imagem seja versionada. A imagem nova vem no mesmo artefato, em `tests/snapshots/`; revise-a antes de versionar. Todas as seções ficam no DOM ao mesmo tempo, então máscaras e seletores dos testes visuais precisam se limitar à seção ativa, `.pages-stack > .page:not(.page--inactive)`.

## Git, pull requests e publicação

- `main` é a única branch permanente e a branch de produção do site `brgarcias-portfolio` no Netlify. Cada merge em `main` publica o site em <https://brgarcias-portfolio.netlify.app>. Não crie `develop` nem outra branch permanente.
- Crie uma branch de trabalho a partir de `main` atualizada, com prefixo como `feat/`, `fix/`, `docs/`, `test/` ou `chore/`.
- Mensagens de commit seguem Conventional Commits, em inglês, como `fix: keep the menu usable after a fast close`.
- Os commits precisam de assinatura verificada pelo GitHub. O hook de pre-commit roda o Prettier nos arquivos preparados. Nunca use `--no-verify` nem desative a assinatura.
- Abra o PR com destino a `main`. O título segue Conventional Commits, e título e descrição ficam em português.
- O Netlify gera um Deploy Preview para cada PR, em `https://deploy-preview-<número>--brgarcias-portfolio.netlify.app`. A `main` exige quatro checks do Netlify: `Header rules - brgarcias-portfolio`, `Pages changed - brgarcias-portfolio`, `Redirect rules - brgarcias-portfolio` e `netlify/brgarcias-portfolio/deploy-preview`.
- O job `quality` do GitHub Actions também roda em cada PR. Só faça o merge com ele aprovado.
- A `main` exige histórico linear e PR atualizado em relação a ela. Faça merge só com **Squash and merge**, depois que os checks passarem.
- Nunca faça push direto ou force push em `main` e nunca altere as proteções da branch.
- Não publique pelo Netlify CLI. A produção só muda por merge em `main`.
- A configuração do Netlify fica no painel do site. Não há `netlify.toml` no repositório.
