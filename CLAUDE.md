# CLAUDE.md

@AGENTS.md

## Notas para o Claude Code

- Cada comando do terminal roda em um shell novo. O padrão do nvm nesta máquina é o Node 24, mas ative a versão do `.nvmrc` no mesmo comando, como em `nvm use >/dev/null && pnpm check`, para não depender do padrão. Com outra versão, a instalação falha por causa do `engine-strict` e o Netlify CLI quebra.
- O GitHub CLI e o Netlify CLI já estão autenticados nesta máquina. O site do Netlify é `brgarcias-portfolio`, com id `ecd87a46-f0e6-4b11-8ae0-e5cc1b698015`.
- Logo depois de abrir um PR, `gh pr checks --watch` pode responder que não há checks. Espere alguns segundos e acompanhe de novo.
- O merge é automático. Depois de abrir o PR, espere os quatro checks do Netlify e o job `quality` do GitHub Actions. Se todos passarem e o PR estiver sem conflitos, faça o merge com squash sem pedir confirmação. Se algum check falhar, corrija na mesma branch e só faça o merge quando tudo passar. Espere a revisão apenas quando o pedido disser isso.
- O Netlify não publica status nos commits de `main`. Depois do merge, confira o deploy de produção na lista de deploys do site e só considere a mudança publicada quando o deploy do commit estiver com estado `ready`:

  ```sh
  nvm use >/dev/null && netlify api listSiteDeploys --data '{"site_id":"ecd87a46-f0e6-4b11-8ae0-e5cc1b698015","per_page":3}'
  ```

- `.claude/settings.json` bloqueia comandos destrutivos, como apagar o site no Netlify, publicar pelo Netlify CLI, apagar o repositório ou enviar `DELETE` pela API do GitHub. Não contorne esses bloqueios. Permissões pessoais ficam em `.claude/settings.local.json`, que não é versionado.
