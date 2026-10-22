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

`pnpm dev` e `pnpm build` usam o webpack, e não o Turbopack. O minificador de CSS do Turbopack, o Lightning CSS, troca transformações 3D como `translate3d(0, 150px, 0)` por equivalentes 2D. A geometria é a mesma, mas o navegador deixa de criar camadas próprias para esses elementos, e imagens reduzidas, como as prévias da seção de projetos, passam a ser desenhadas com outra filtragem. Com o webpack, o CSS publicado continua igual ao de antes.

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
