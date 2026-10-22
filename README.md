# Bruno Garcia — portfólio

Portfólio profissional de Bruno Garcia, desenvolvedor full-stack. O site é uma página única em inglês, feita com Next.js, publicada no Netlify em <https://brgarcias-portfolio.netlify.app>.

## Executar localmente

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Abra <http://localhost:3000>. Para o build de produção, use `pnpm build` e `pnpm start`.

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
