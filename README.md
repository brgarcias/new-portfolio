# Bruno Garcia — portfólio

Portfólio profissional de Bruno Garcia, desenvolvedor full-stack. O site é uma página única em inglês, feita com Next.js, publicada no Netlify em <https://brgarcias-portfolio.netlify.app>.

## Executar localmente

Pré-requisitos: nvm e Corepack ou pnpm 11.

```sh
nvm install
nvm use
corepack enable
corepack prepare pnpm@11.3.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

Abra <http://localhost:3000>. O projeto usa Node.js 24 LTS, Next.js 16 com App Router, React 19, TypeScript estrito, Tailwind CSS 3 e HeroUI. O pnpm é o gerenciador oficial; mantenha somente `pnpm-lock.yaml` atualizado. O npm que acompanha o Node é suficiente para instalar o pnpm, se Corepack não estiver disponível: `npm install --global pnpm@11.3.0`.

## Verificar e compilar

```sh
pnpm check
pnpm build
pnpm start
```

Os comandos de lint, tipos e formatação também podem ser executados individualmente: `pnpm lint`, `pnpm typecheck` e `pnpm format`. Para aplicar a formatação: `pnpm format:fix`. O hook de pre-commit formata os arquivos preparados com o Prettier.

## Testes

Os testes de navegador rodam em desktop (1440 px) e em celular (iPhone 13) sobre o build de produção. Eles cobrem a navegação pelo menu e o fechamento com Esc, as experiências, as etapas da formação, o modal dos cursos, o slider e os detalhes dos projetos, as contribuições, as abas de contato, o download do currículo, os links de contato, a validação e o envio do feedback e a página 404.

```sh
pnpm exec playwright install chromium
pnpm build
pnpm test:e2e
```

Para usar um Chromium já instalado, defina `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` com o caminho completo do executável. Capturas e rastros de falhas ficam em `test-results/`, ignorado pelo Git.

### Testes visuais

`tests/visual.spec.ts` compara cada seção e cada estado interativo com as imagens de `tests/snapshots/`. Essas imagens são o contrato da aparência do site: qualquer mudança de estilo, mesmo de um pixel de deslocamento ou de uma cor, faz o teste falhar. Trechos que dependem da data de hoje, como a duração do emprego atual e a idade, ficam mascarados.

As fontes são desenhadas de forma diferente em cada sistema operacional, então os testes visuais só rodam no Linux, dentro do contêiner `mcr.microsoft.com/playwright:v1.64.1-noble`, que é o mesmo do CI. Em outros sistemas, `pnpm test:e2e` os ignora. A tag do contêiner acompanha a versão de `@playwright/test`; ao atualizar uma, atualize a outra e regrave as imagens.

Quando uma mudança visual for intencional, o teste falha e o CI publica as novas imagens no artefato `test-results`, com o sufixo `-actual.png`. Confira as imagens e copie cada uma para `tests/snapshots/<desktop|mobile>/`, com o nome sem o sufixo. Um teste visual novo grava a própria imagem e passa, mas o job falha no passo **Fail on new screenshots** até que ela seja versionada; a imagem fica no mesmo artefato, em `tests/snapshots/`.

O GitHub Actions roda `pnpm check`, `pnpm build` e `pnpm test:e2e` em cada pull request para `main`, no job `quality` de `.github/workflows/ci.yml`. Quando algo falha, a pasta `test-results/` fica disponível como artefato da execução por sete dias.

## Observações sobre o build

`pnpm dev` e `pnpm build` usam o webpack, e não o Turbopack. O minificador de CSS do Turbopack, o Lightning CSS, troca transformações 3D como `translate3d(0, 150px, 0)` por equivalentes 2D. A geometria é a mesma, mas o navegador deixa de criar camadas próprias para esses elementos, e imagens reduzidas, como as prévias da seção de projetos, passam a ser desenhadas com outra filtragem. Com o webpack, o CSS publicado continua igual ao de antes.

## Busca e compartilhamento

O site é verificado no Google Search Console como propriedade de prefixo do URL, pela meta tag `google-site-verification`. A página publica URL canônica, Open Graph para a prévia em WhatsApp e LinkedIn, dados estruturados `Person`, `robots.txt` e `sitemap.xml`. No Search Console, envie `https://brgarcias-portfolio.netlify.app/sitemap.xml` em **Sitemaps**. O endereço do site fica em `src/app/site.ts`.

## Formulário de feedback

O botão **Leave Feedback** abre o formulário, que envia nome, e-mail e mensagem ao Netlify Forms, no formulário `contact`. As mensagens chegam ao painel do Netlify, em **Forms → contact**, e também por e-mail, se a notificação estiver configurada em **Site configuration → Notifications → Emails and webhooks → Form submission notifications**. O Netlify filtra spam, e o campo oculto `bot-field` descarta robôs que o preenchem.

O formulário envia os dados para `public/contact.html`, que declara os campos para o Netlify. Ao mudar um campo, atualize os dois arquivos.

## Publicação

O site é publicado pelo Netlify, no site `brgarcias-portfolio`, a cada merge em `main`.

### Fluxo de branches e Netlify

`main` é a única branch permanente do repositório e a branch de produção do site `brgarcias-portfolio` no Netlify. Cada merge em `main` publica o site.

Para qualquer alteração, crie uma branch de trabalho a partir de `main` e abra um pull request com destino a `main`. O Netlify gera um Deploy Preview para cada PR, com endereço próprio, para validar a mudança antes da publicação.

```sh
git switch main && git pull
git switch -c feat/minha-alteracao
# faça commits assinados
git push -u origin feat/minha-alteracao
gh pr create --base main --fill
# após a aprovação dos checks
gh pr merge --squash --delete-branch
git switch main && git pull --prune
```

A branch `main` exige pull request, histórico linear, commits com assinatura verificada pelo GitHub, PR atualizado em relação a `main` e os checks do Netlify. Antes do merge, confira os resultados no PR. Use **Squash and merge**: o GitHub assina o commit gerado, o que atende à exigência de assinatura. Se o PR ficar desatualizado, use **Update branch** ou faça rebase da branch de trabalho sobre `main`.

Não use uma segunda branch permanente, como `develop`, para promover alterações a `main`. Com histórico linear obrigatório, cada squash ou rebase cria em `main` um commit que não existe na outra branch, e as duas divergem a cada publicação. No painel do Netlify, em **Branches and deploy contexts**, somente `main` tem deploy de branch; os Deploy Previews de PRs continuam ativos.

Para assinaturas SSH, a chave pública usada pelo Git deve estar cadastrada no GitHub como **Signing Key**. Uma chave cadastrada apenas para autenticação não basta para verificar a assinatura dos commits.

### Agentes de código

As instruções para agentes de código ficam em `AGENTS.md`. O `CLAUDE.md` importa esse arquivo e acrescenta notas específicas do Claude Code. O `.claude/settings.json` bloqueia comandos destrutivos, como apagar o site no Netlify, publicar pelo Netlify CLI ou apagar o repositório. Configurações pessoais do Claude Code ficam em `.claude/settings.local.json`, que não é versionado.
