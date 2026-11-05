# Política de segurança

Este repositório guarda o código do portfólio de Bruno Garcia, publicado em <https://brgarcias-portfolio.netlify.app>. Se você encontrou uma falha de segurança, obrigado por avisar: este documento diz como relatar, o que entra no escopo e como o projeto se protege.

## Como relatar

Não abra uma issue pública nem um pull request com a correção antes de falar com o mantenedor. Use um destes canais privados:

- O formulário de relato privado do GitHub: [Report a vulnerability](https://github.com/brgarcias/new-portfolio/security/advisories/new). É o canal preferido, porque mantém a conversa, a correção e o crédito no mesmo lugar.
- O e-mail <bruno-151299@hotmail.com>, com "Segurança" no assunto.

Conte o que encontrou e onde (o endereço da página, o arquivo ou a dependência), como reproduzir e o impacto que você vê. Uma prova de conceito ajuda, mas não é obrigatória. Por favor, não acesse nem altere dados que não sejam seus e não faça testes que derrubem o site.

O que esperar:

- Uma resposta em até 7 dias, confirmando o recebimento.
- A avaliação do impacto e, quando for mesmo uma falha, a correção por pull request, publicada no merge em `main`. O prazo depende da gravidade: falhas que expõem dados ou permitem executar código vêm primeiro.
- Um aviso quando a correção estiver no ar e, se você quiser, o crédito no advisory. Peço que o relato fique privado até lá.

Não há programa de recompensas: é um projeto pessoal.

## Versões com suporte

O site não tem versões numeradas. Só a branch `main`, que é o que está publicado em <https://brgarcias-portfolio.netlify.app>, recebe correções. As prévias de deploy (`deploy-preview-*.netlify.app`) e os forks não.

## Escopo

Entram no escopo:

- O site publicado, nos três idiomas, inclusive o jogo em `/play` e o painel de conteúdo em `/admin`.
- O código deste repositório: as páginas, a configuração do Next.js, as dependências, o fluxo do GitHub Actions e o painel.

Ficam fora:

- Falhas nas plataformas usadas, como o GitHub e o Netlify: relate a elas.
- O que exige acesso à conta do mantenedor, ao repositório ou ao Netlify, como phishing e engenharia social.
- Testes de negação de serviço contra o site no ar e envios em massa pelo formulário de feedback.
- Relatos de scanners automáticos sem um impacto demonstrado, como a falta de um cabeçalho ou uma boa prática genérica.
- Os dados de contato que o site mostra de propósito: nome, cidade, e-mail, telefone, LinkedIn e GitHub são públicos por escolha, porque é para isso que o portfólio existe.

## Como o projeto se protege

- A branch `main` só muda por pull request, com commits assinados, histórico linear e os checks do CI e do Netlify verdes; não há push direto nem force push.
- O Dependabot avisa das dependências vulneráveis e abre as atualizações de segurança. O CodeQL analisa o JavaScript, o TypeScript e os workflows em cada pull request e toda semana. O secret scanning, com proteção de push, impede que um segredo entre no histórico.
- O site envia Content Security Policy e os demais cabeçalhos de segurança, definidos em `next.config.mjs`, e, fora do painel `/admin`, só carrega scripts, estilos, fontes e imagens do próprio domínio.
- O painel `/admin` entra com o GitHub e só aceita quem pode escrever no repositório; cada edição vira um pull request com os mesmos checks.
- O site não tem banco de dados. O que o formulário de feedback recebe fica no Netlify Forms, protegido por um campo armadilha para robôs, e o tema e o progresso do jogo ficam só no navegador do visitante.

## Dependências

Cada alerta do Dependabot é tratado por pull request:

- Quando existe uma versão corrigida, a dependência sobe. Se quem a pede ainda não aceita essa versão, um `overrides` em `pnpm-workspace.yaml` força a versão corrigida, com o alerta e o motivo em comentário.
- Quando não existe correção, o uso real no projeto decide. Se a falha não é alcançável, o alerta é dispensado no GitHub com a justificativa e fica registrado abaixo, para ser revisto quando a correção aparecer.

O Dependabot também propõe, toda semana, as atualizações de versão, cada uma com pelo menos 7 dias desde o lançamento. As minors e os patches entram sozinhos quando todos os checks passam; as majors esperam uma revisão.

Alertas dispensados:

| Pacote            | Aviso                                                                    | Motivo                                                                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deepmerge` 4.3.1 | [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) | Só o plugin do Tailwind do HeroUI o usa, no build, para juntar o tema padrão à configuração do próprio projeto. Nenhum dado de visitante passa por ele. Não há versão corrigida. |

## In English

Please report vulnerabilities privately, through [GitHub's vulnerability report form](https://github.com/brgarcias/new-portfolio/security/advisories/new) or by e-mail to <bruno-151299@hotmail.com>, instead of opening a public issue. Only the `main` branch, deployed at <https://brgarcias-portfolio.netlify.app>, is supported. You can expect an acknowledgement within 7 days, a fix through a pull request when the report is confirmed, and credit in the advisory if you want it. The sections above, in Portuguese, describe the scope and the protections in place.
