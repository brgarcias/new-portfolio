# AGENTS.md do jogo

Instruções para agentes de código que mexem no jogo de `/play`, em `src/app/game/`. Valem junto com o `AGENTS.md` da raiz, que tem as regras do projeto: a aparência protegida, o ambiente, os comandos, o fluxo de PRs e a versão do three e do `@react-three/fiber`, que só sobem juntos.

## Visão geral

- `src/app/game/` é o jogo da página `/play`: um mundo 3D em que o visitante pilota uma nave do Star Wars, escolhida num hangar, por uma plataforma no espaço com uma plataforma de pouso para cada seção do site.
- `index.tsx` confere se o navegador desenha WebGL e só então baixa, com `next/dynamic`, o `Game.tsx` e o three.js; o site não carrega nada disso.
- Os elementos que o quadro escreve (o HUD, com a posição, o rumo, a velocidade e o tempo de voo em atributos `data-*`, e os rótulos) se registram em `overlay.ts`. As regras do React Compiler no ESLint não aceitam mudar props nem valores de hooks nos callbacks, por isso o estado do voo, os controles e esses elementos são objetos de módulo.
- As geometrias por quadro mudam só por objetos de módulo (os uniforms de tempo, as cores do céu, os rebanhos), porque o React Compiler não aceita mudar valores de `useMemo` nos callbacks.
- Os textos do jogo ficam em `game`, nas mensagens de `src/i18n/messages/`.

## Voo

- `physics.ts` é o voo rasante (empuxo, inércia, giro, colisão com os obstáculos e com a borda da plataforma), em aritmética pura, sem motor de física.
- `controls.ts` junta o teclado e o joystick de toque num objeto de módulo que cada quadro lê.
- `Ship.tsx` move a nave e a câmera a cada quadro, desenha o rastro dos motores (duas fitas que esmaecem com a idade, só com velocidade), as chamas atrás de cada motor (dois cones aditivos que crescem com o empuxo e o turbo e tremulam), o vento do turbo (riscos em volta da nave que passam para trás) e o anel que se espalha na plataforma ao pousar, sacode a câmera numa batida, com a física em passos fixos de 1/60 s que somam o tempo do quadro (até 1 s), para um quadro lento, como no renderizador por software do CI ou num celular fraco, não deixar o jogo em câmera lenta.
- A câmera abre um pouco o campo de visão no turbo.
- O voo começa com a chegada (`arrive` e `descend`, em `Ship.tsx`): a nave sai do hiperespaço, com raios de luz em volta da câmera que encolhem até virar estrelas, e a câmera, no alto da plataforma, olha primeiro para o horizonte e depois desce numa espiral até o lugar dela atrás da nave, em 2,6 s, três vezes mais rápido quando o piloto se move; o HUD tem `data-arriving` enquanto isso, e com "reduzir movimento" a câmera já começa atrás da nave.
- Um quadro lento anda no máximo um décimo de segundo da chegada, para os primeiros quadros, lentos enquanto o mundo é preparado, não pularem a chegada.
- O `lookAt` do three.js atualiza as matrizes da câmera antes de trocar a rotação dela, e os rótulos das plataformas são projetados com essas matrizes no mesmo quadro: depois de girar a câmera de outro jeito, chame `camera.updateMatrixWorld()`.
- `Adaptive.tsx` baixa a resolução do canvas, um quarto por vez, depois de meio segundo de quadros lentos, como num celular fraco ou no renderizador por software do CI, e a devolve depois de quatro segundos de quadros rápidos.

## Naves

- `ships/` tem as seis naves, montadas em código a partir de formas simples (`parts.ts`), com os nomes reais das naves do Star Wars, decisão do Bruno, que assume o risco de direitos; nunca baixe modelos de terceiros.

## Mundo

- `world/arena.ts` tem a plataforma, as plataformas de pouso, um marco ao lado de cada uma (para fora do centro, sólido: a casa, a torre, a cabana, o salão, o palácio, a vila e o hangar de cada planeta), os obstáculos e as plantas, gerados por uma sequência aleatória fixa, com a rota do começo até a primeira plataforma sempre livre; o chão de cada plataforma e o que a cerca (baixo, para a nave passar por cima) são parte do setor, em `padBuilders` e `landmarkBuilders` de `props.ts`, e só as luzes das plataformas (anéis, centros, brilhos e feixes) são instâncias.
- `world/biomes.ts` divide a plataforma em sete setores, um por seção, cada um vestido de um planeta da saga (Tatooine, Coruscant, Dagobah, Kamino, Naboo, Endor e Hoth, nomes que o Bruno assume como assumiu os das naves), com as cores do chão, a paleta do céu, da névoa e das luzes, o clima e a cor de destaque, e `sectorAt` diz em que setor um ponto está (o centro é o hub, um convés no espaço).
- `world/World.tsx` compõe tudo: `terrain.ts` é o relevo (dunas, neve), plano sob as plataformas, no hub e na borda, que `Ground.tsx` (o chão, um disco só com a cor e o relevo do setor em cada vértice, e a borda acesa na cor de cada setor), os obstáculos, as plantas e os bichos leem, para tudo ficar em cima do chão.
- `builder.ts` junta formas simples, cada uma numa cor chapada, numa geometria só por setor, com as cores nos vértices (e as partes acesas, como janelas, numa segunda, sem luz), para cada setor sair em uma ou duas chamadas de desenho.
- `props.ts` veste cada obstáculo conforme o setor (vaporizadores e um sandcrawler, torres com andares acesos, árvores retorcidas e a cabana do mestre, salões sobre estacas no mar, casas de domo verde, sequoias com cabanas, espirais de gelo e a entrada da base) e desenha as plantas (arbustos, cogumelos que brilham, árvores, flores, samambaias, cristais, e um X-wing afundado no pântano, cozido na mesma geometria).
- `Fauna.tsx` são os bichos de cada setor (banthas, speeders nas vias da cidade, sapos, aiwhas voando em círculos, shaaks, ewoks e tauntauns), um `InstancedMesh` por espécie, que o quadro move dentro do próprio setor, longe das plataformas e dos obstáculos, e que param com "reduzir movimento".
- `Weather.tsx` é o clima de cada setor (areia, esporos, chuva, pólen, vagalumes e neve), pontos que o shader move com só o tempo como uniform.
- `Water.tsx` é a água (o mar de Kamino, o lago de Naboo, que escorre em duas cachoeiras pela borda, e as poças de Dagobah), com shaders simples.
- `Atmosphere.tsx` é o céu (um shader com as cores do alto, do horizonte e de baixo), as estrelas, a névoa e as luzes, que seguem o setor da nave (`atmosphere.sector`, que `Ship.tsx` escreve) numa transição suave, com relâmpagos sobre Kamino.
- `Far.tsx` são as vistas longe de cada planeta (os dois sóis, o gigante gasoso, a silhueta da cidade e as nuvens).
- As plataformas de pouso são instâncias (anéis, centros, brilhos e feixes) na cor do próprio planeta, mais claras com a nave em cima e em ciano depois de visitadas, e os bichos que esbarram em algo viram de uma vez e seguem, sem tremer.

## Missão, holocrons e progresso

- `arena.ts` esconde também um holocron por planeta (`holocrons`), flutuando na altura das naves: o primeiro fica no caminho até a primeira plataforma, os outros no primeiro ponto livre perto do meio do setor.
- `world/Holocrons.tsx` os desenha (cinco instâncias: a casca, o núcleo, o brilho, um feixe de luz fraco acima de cada um ainda escondido, para ser visto de longe, e o anel de luz que se espalha de um recém-achado) girando e flutuando, e o que foi achado cresce e some.
- `Ship.tsx` acha um holocron ao passar a menos de 3,5 unidades dele, conferido a cada passo da física, para um quadro lento não levar a nave por cima dele, e avisa o jogo (`onCollect`), com o estado em `hunt.ts`, que dura a página.
- O progresso (as seções pousadas, os holocrons achados e os registros lidos) fica em `progress.ts`, no `localStorage` (`progress`, com o número da versão): ao ler, só valem ids de seções conhecidas, cada um uma vez, e um registro lido só se o holocron dele foi achado, então um progresso danificado, editado à mão ou de outra versão não quebra o jogo, e sem armazenamento o jogo funciona e só esquece no fim da página.
- `Game.tsx` devolve ao `hunt` os holocrons achados em visitas anteriores, que o mundo, o radar e a bússola escondem.
- O radar e o mapa marcam os holocrons com losangos, cheios quando achados.
- O último achado solta uma chuva de faíscas da nave (`sparks`, em `Ship.tsx`, pontos movidos por shader).
- `Archive.tsx` é o arquivo de holocrons, um diálogo na moldura da carta: o registro que cada holocron libera, um por seção, no planeta dela (`content/site/holocrons.json`); um registro achado mostra o texto e o link para a seção no site, e um trancado diz onde está o holocron e traça a rota até ele; o arquivo abre pelo botão ou com H, no registro novo, e marca todos como lidos; no rodapé, a nova exploração apaga o progresso depois de uma confirmação, que começa no "Manter meu progresso".
- Uma exploração nova começa com o aviso da missão (`briefing`), depois da chegada, e o aviso de um holocron traz o título do registro que ele liberou.
- Na primeira vez que a nave entra num planeta, na página (`hunt.entered`), o HUD mostra o título dele, como num filme: o nome em letras largas, a seção acima e um traço na cor do planeta, por 3,4 s (`PlanetTitle`, numa região `role="status"`); enquanto isso os rótulos das plataformas somem, e no celular o título fica no lugar dos avisos, que descem para baixo dele.

## Som e modo foto

- `sound.ts` são os sons, sintetizados na hora com a Web Audio API (sem arquivo, então a CSP não muda): o ronco dos motores, que sobe com o empuxo, a velocidade e o turbo, o vento, e notas curtas para o pouso, o holocron, a batida, a decolagem, a foto e a festa; ficam desligados até o botão do HUD ligar (o clique é o gesto que o AudioContext exige), e a escolha fica no `localStorage` (`sound`); o ronco e o vento se calam quando a nave sai do voo (`quiet`, ao desmontar `Ship.tsx`), e o contexto dorme enquanto a página está escondida.
- `Snapshot.tsx`, dentro do canvas, desenha um quadro na resolução própria do canvas (mesmo com a resolução baixada por quadros lentos, que volta logo depois) e lê o canvas para o modo foto (P, ou o botão da câmera), que esconde o HUD e os rótulos e deixa só os botões de salvar a foto (`portfolio-<planeta>.png`) e sair (Escape).

## HUD

- `Hud.tsx` são os instrumentos do voo, um sistema só sobre o canvas: no canto de cima à esquerda, a volta ao portfólio, o registro da missão (seções exploradas e holocrons, em barrinhas e losangos, com o total), os avisos de que tudo foi explorado ou achado e os botões do arquivo (com a contagem de registros novos), do som, do modo foto e do modo do HUD, sob o rótulo da missão.
- O HUD tem três modos, que o botão do olho ou a tecla V alternam e o `localStorage` guarda (`hud`), no atributo `data-hud`: completo; mínimo, sem a bússola, as coordenadas, o rótulo da missão e as teclas; e imersivo, que deixa só a volta, o botão do modo, a zona de pouso, os avisos e, no toque, o joystick e o turbo (o modo foto continua à parte, para a foto).
- Quem ainda não saiu do lugar nove segundos depois da chegada, sem nada aberto, recebe uma vez os controles (`hint`), pelo teclado ou pelo toque.
- No alto, a bússola (`Compass.tsx`, uma fita de rumos que desliza com a nave, com o rumo sob o cursor e marcas das plataformas, dos holocrons e da rota, que fica na borda da fita, com a distância, quando está para trás); à direita, o radar (`Radar.tsx`, com a nave no meio apontando para cima e o mundo girando sob ela até o anel, os setores nas cores e texturas dos planetas, os obstáculos, as plataformas, os holocrons ainda escondidos, uma divisa no anel para o que está fora do alcance e para a rota, a marca do rumo inicial no aro e uma varredura em CSS), que é um botão que abre a carta de navegação, e embaixo dele o planeta sob a nave e as coordenadas.
- Embaixo à esquerda, a nave, o modelo e a velocidade, com a barra que fica âmbar no turbo, e a troca de nave.
- Embaixo, as teclas como teclas ou os controles de toque, com o joystick sob o polegar direito e o turbo sob o esquerdo.
- No meio, a zona de pouso sob a nave, com um anel que enche enquanto ela fica parada e vira um visto quando pousa (`data-phase`: `approach`, `hold` e `landed`).
- Os avisos de holocron recuperado e de portfólio explorado, que somem sozinhos.
- E o final dos holocrons (`Finale`), com faixas de cinema, o título, os sete losangos e as faíscas.
- O HUD mostra o planeta sob a nave (`.hud__planet`, que o quadro troca pelo atributo `hidden`), o radar pinta os setores e os rótulos das plataformas trazem o planeta; o rótulo da plataforma em que a nave está some, porque o HUD já a nomeia (`Labels.tsx` lê a `telemetry`); as seções e o mapa entram na mesma mola.
- `Labels.tsx` mantém os rótulos das plataformas, em HTML, sobre elas, com o planeta, a seção e a distância ao vivo, e marca o da rota.
- O rótulo de uma plataforma atrás da câmera ou fora da tela sai da página (`display: none`), em vez de esperar centenas de pixels além da borda, que o navegador do celular podia tomar por mais página.
- Um rótulo que encosta numa peça do HUD (os grupos dos cantos, a bússola, os controles de toque e os avisos, medidos duas vezes por segundo) fica invisível, porque as placas do HUD são translúcidas e o rótulo se embolava com as leituras, como sobre o registro da missão ou o radar no celular.
- `telemetry.ts` é o que os instrumentos leem (posição, rumo, velocidade, turbo, setor, plataforma e a fase do pouso), que `Ship.tsx` escreve a cada quadro, e a rota (`navigation`).
- `instruments.ts` move os instrumentos direto no DOM, a cada quadro, pelos elementos registrados em `overlay.ts`, sem renderizar o React, só escreve o que mudou e troca os textos dez vezes por segundo; o que se move a cada quadro (o mapa do radar, a varredura, a marca do rumo inicial, as divisas, a fita e as marcas da bússola, a barra de velocidade e os rótulos) se move por `transform` em camadas próprias (`will-change: transform`), que o compositor move sem desenhar de novo: o SVG do radar com as texturas, redesenhado a cada quadro, chegou a custar um terço dos quadros no renderizador por software; a carta separa o que é desenhado uma vez (`chart__base`) do que se move (`chart__live`); e nenhuma animação contínua anima um filtro ou um elemento dentro de um SVG grande, que se redesenharia a cada quadro.
- `chart-parts.tsx` tem as formas que o radar e a carta dividem, `ui.tsx` as peças pequenas (contadores, teclas, o cubo do holocron e o desenho de cada nave) e `useDialog.ts` o comportamento dos diálogos (foco dentro, Tab preso, Escape e o foco de volta).

## Carta de navegação

- `GalaxyMap.tsx` é a carta de navegação, um diálogo com a carta (`Chart.tsx`: a plataforma inteira com o norte para cima, o anel de rumos, os anéis de distância, os setores, as plataformas numeradas como as seções, os holocrons, a rota e a nave) e os destinos, cada um com a distância e o rumo ao vivo, o estado e o holocron, que traçam uma rota (outro clique a desfaz); o livro ao lado de cada destino abre a seção na hora, sem voar até ela (`Panel.tsx` com `remote`, que diz "Acesso remoto" no lugar da zona de pouso), para quem veio mais pelo portfólio que pelo voo: a nave não sai do lugar, e a seção não conta como explorada; a bússola, o radar, o rótulo da plataforma, o feixe dela e a carta seguem a rota, que some ao pousar ali.
- A carta abre pelo radar ou com M e fecha pelo X, por M, por Escape ou por um clique fora; com ela aberta o teclado não pilota.

## Painel das seções

- Uma plataforma de pouso segura a nave (`physics.ts`), e quando ela para ali por meio segundo o jogo abre a seção daquela plataforma em `Panel.tsx`, um diálogo sobre o voo, como uma transmissão no terminal da nave (uma barra com o planeta e a zona de pouso, na cor do planeta, a seção com o mesmo componente que a home usa e um rodapé com a volta ao voo e o link para a seção no site), renderizado no servidor por `play/page.tsx` e passado ao jogo como `panels`; a seção About tem o próprio componente, `src/app/about-me/About.tsx`, para o jogo não trazer o topo junto.
- O painel fecha pelo botão, por Escape ou por um clique fora, e a plataforma só abre de novo quando a nave sai e volta.

## Hangar

- `Hangar.tsx` é o terminal do hangar: o palco com a nave no pedestal, com a moldura de projetor (o modelo e a classe, o número da baia, a dica do arrasto e a leitura do giro) e uma luz que o atravessa quando a nave muda; a ficha da nave (número, nome, modelo, classe, fabricante, a descrição e quatro números, velocidade máxima, aceleração, giro e turbo, cada um num medidor que o coloca entre as seis naves, por `specOf`, de `ships/index.ts`); e a lista das seis, um grupo de rádios com o desenho de cada nave (`silhouette`, em `ships/index.ts`), que as setas, Home, End e as teclas de 1 a 6 percorrem; Enter decola.
- A escolha fica no `localStorage` (`ship`); um arrasto no palco gira a nave em qualquer direção, com inércia, e ela volta a girar sozinha depois de um instante e se endireita depois de um tempo parada; ela inclina em torno da direita da câmera, nivelada com o chão, para seguir o arrasto seja qual for o giro: para baixo, o topo vira para a câmera; uma nave nova cresce no pedestal numa mola (o palco expõe o giro em `data-yaw` e `data-pitch`, e em `data-top` quanto o topo da nave está virado para a câmera).
- Decolar é uma sequência de lançamento: no toque ou no Enter, `onIgnite` liga o som da decolagem (ainda dentro do gesto, que o áudio do navegador exige), a nave vira para longe da câmera, sai do pedestal com os motores acesos e dispara pela linha de visão, enquanto o hangar escurece (`data-launching`); `onTakeOff` passa ao voo quando ela termina (`launchTime`, 950 ms), e o voo entra vindo do escuro; enquanto isso, nem o teclado troca de nave.
- Na volta ao hangar, o voo some num fade (`data-departing`, 380 ms); a carta e as seções somem num fade ao fechar (`data-leaving`, 180 ms), com `inert`, e o `useDialog` devolve o foco assim que deixam de estar ativas.
- Com "reduzir movimento", tudo acontece na hora.
- O teste da decolagem usa o relógio do Playwright (`page.clock`), para o lançamento esperar o tempo que o teste manda.
- Até 1023 px de largura (celular e tablet), o botão de decolar fica preso embaixo da tela, numa faixa escura em que o que rola por baixo some (`hangar__dock`); a ficha da nave entra só com um fade, sem `transform`, porque um `transform` num ancestral, mesmo de uma animação já terminada, prende um elemento `fixed` dentro dele, e foi o que deixou o botão no fim da página, por cima dos números da ficha, no celular.
- A lista das naves vem antes da ficha no DOM, para o Tab chegar à nave antes de decolar; a grade mantém a ordem na tela.

## Interface

- A interface do jogo, em `src/app/game/styles.css`, é um sistema próprio, de sistemas de bordo num holonet, com os tokens em `.play` (`--g-*`): o azul holográfico desenha os instrumentos, o roxo da marca marca o que se escolhe e o que lança, o âmbar a rota e o turbo, o verde-água o que foi explorado, o ciano os holocrons e a cor de cada planeta o que é dele; linhas finas, cantoneiras e cantos cortados no lugar de pílulas e cartões; placas escuras atrás de toda leitura, para valer sobre qualquer céu; e movimento que liga como um projetor, um tremor e depois firme, com tudo parado em "reduzir movimento".
- As peças comuns são `.g-btn` (com `--primary` e `--icon`), `.g-label`, `.g-num` (números tabulares), `.g-kbd` (teclas, que somem nas telas de toque) e `.g-sr` (texto só para leitores de tela).
- A interface do jogo é a mesma cabine escura nos dois temas do site; as seções que ela abre seguem o tema do site.
- Em telas de toque mais largas que um celular (tablets), o joystick e o turbo ficam nos cantos de baixo e o painel da nave sobe para cima do turbo.
- Em telas baixas e largas, como o celular deitado (`orientation: landscape` e no máximo 500 px de altura), o HUD fica nas bordas como no celular, com o radar e o lugar à direita, e a zona de pouso, o título do planeta e os avisos se empilham no alto, entre eles; os diálogos ocupam a tela, a carta ao lado dos destinos, que rolam sozinhos; e o hangar põe o palco ao lado da ficha, sob um cabeçalho curto.
- No celular, a composição muda: a bússola e a ficha da nave saem, a volta e a troca de nave viram ícones lado a lado, o registro mostra ícones no lugar dos rótulos, os avisos ficam compactos sob os instrumentos e descem quando a zona de pouso aparece, e os diálogos ocupam a tela, com os dois botões do rodapé do painel um sob o outro quando não cabem lado a lado.
- Os gestos do navegador ficam fora do jogo: o voo tem `touch-action: none`, o hangar `manipulation` (um segundo toque rápido numa nave não amplia a página) e as partes que rolam nos diálogos `pan-x pan-y` (rolam, mas uma pinça não amplia a página por baixo dos controles).

## Testes

Os testes do jogo ficam em `tests/game.spec.ts` e exigem:

- O hangar com as seis naves e a escolha guardada, o arrasto que gira a nave e a inclina para o lado do ponteiro, a missão guardada para a próxima visita (pelo `localStorage`, aproveitando só o que reconhece de um progresso de outra versão, e jogável com o progresso ilegível ou sem armazenamento), o arquivo de holocrons, que abre no registro novo, traça a rota de um trancado e recomeça a exploração só depois de confirmar, a seção lida pela carta sem pousar nem contar a visita, os três modos do HUD guardados para a próxima visita, os controles para quem não sai do lugar, a lista das naves pelo teclado (setas, Home, End, números e Enter para decolar) e a ficha de cada nave
- O voo pelo teclado (empuxo, giro, turbo e pouso na primeira plataforma, sem sair da plataforma) e pelo joystick no celular
- A zona de pouso, que termina em pousado
- A chegada do hiperespaço, que termina sozinha e não acontece com "reduzir movimento"
- O título de cada planeta, uma vez, a primeira vez que a nave entra nele
- O aviso do holocron recuperado no caminho até a primeira plataforma
- A seção que abre ao pousar, no planeta dela, com o link para o site, fechando por Escape e pelo botão, sem abrir de novo até a nave sair, e sem o teclado pilotar enquanto ela está aberta
- A carta de navegação, com os sete planetas, as seções, os holocrons e a rota, que o rótulo da plataforma segue e que um segundo clique desfaz
- As páginas em português e espanhol e `/en/play` levando a `/play`
- O aviso sem WebGL
- O som que liga pelo botão e fica guardado, e os motores que se calam no hangar e numa página escondida
- O modo foto que esconde o HUD e salva a imagem
- O hangar, o HUD e a carta que cabem no celular deitado, sem peças sobrepostas
- A política de segurança do site, sem violações
- Os rótulos das plataformas que somem sob as peças do HUD no celular, em vez de se embolar com o registro da missão ou o radar.

- O Chromium dos testes desenha o WebGL por software, e no CI cada comando à página pode levar um segundo: por isso os testes de pouso esperam o relógio do voo andar (`data-time`), dão um impulso cronometrado de dois segundos e meio, que acaba bem antes da primeira plataforma, e deixam a plataforma segurar a nave, em vez de reagir ao que leem da página: ela segura a nave mesmo que o impulso acabe um segundo antes ou um segundo depois.
- O impulso é disparado e solto por um temporizador da própria página (`hold`, em `tests/game.spec.ts`), porque um comando do teste pode chegar à página com atraso e manter o empuxo além da plataforma; as leituras depois dele são de posição, não de velocidade, porque a plataforma pode já ter parado a nave.
- O giro de volta é solto pela própria página no primeiro quadro em que o HUD mostra o rumo além do alvo (`steer`), porque um temporizador atrasa quando os quadros vêm lentos e levava o giro longe demais; e o turbo é medido pela própria página, que lê a velocidade do HUD a cada quadro e devolve a maior (`hold`), porque uma leitura do teste podia cair fora do pico.
- As capturas visuais não incluem o jogo, porque cada quadro sai diferente.
- Os testes do jogo com muitos passos sobre o voo (o teclado, a carta e o modo foto) usam `test.slow()`, que triplica o tempo limite, porque no renderizador por software do CI cada passo pode levar um segundo.
