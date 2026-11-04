# Fósforo & Candela e a Chama Perdida

Jogo de navegador original no estilo dos desenhos animados dos anos 1930: um *boss rush* de tiro e plataforma com visual "rubber hose", grão de filme antigo e trilha de ragtime gerada na hora.

## História

Em Vila Vinil, a Chama Eterna do Farol se apagou e seis brasas mágicas foram roubadas. **Fósforo**, o aprendiz do faroleiro, e sua amiga **Candela** precisam derrotar seis figurões para recuperá-las e reacender o Farol:

1. **Gramofone Gustavo**, no Salão de Música: notas musicais, discos que rolam e saltos com onda de choque.
2. **Nuvem Nimbo**, nos Telhados: chuva, raios teleguiados, nuvenzinhas perseguidoras, granizo e ventania.
3. **Rei Relógio**, na Torre: engrenagens, espirais de ponteiros, um pêndulo gigante e o cuco que joga ovos.
4. **Pianão Pafúncio**, no Teatro: chuva de teclas (ache o vão), aviões de partitura teleguiados, martelos que saltam do chão e fileiras de teclas para pular ou agachar.
5. **Mestre Cartola**, no Circo: cartas em leque, coelhos saltitantes, revoada de pombas, teletransporte, estrelas teleguiadas e uma cartola que suga você.
6. **Locomotiva Lola**, na Estação: anéis de fumaça, carvão que vira brasas, jatos de vapor do chão, rodas soltas e vagões desgovernados.

## Personagens

| Herói | Estilo |
|---|---|
| **Fósforo**, o palito destemido | Rebate o rosa **pulando no ar** e quica nele (+1 chama) |
| **Candela**, a velinha valente | Pulo duplo de base. Rebate o rosa com o **dash**, que continua livre depois do rebate |

Os dois começam com o mesmo tiro (faíscas). O Leque de Cera, que era da Candela, agora é uma arma da loja para qualquer herói.

## Modos

- **1 Jogador**: escolha Fósforo ou Candela.
- **2 Jogadores** (cooperativo local): cada um controla um herói. Quem perder toda a vida vira fantasma; o parceiro **rebate o coração rosa** do fantasma para revivê-lo. Os chefões ficam mais resistentes.

## Jogar online (cada um no seu aparelho)

Dois iPads, celulares ou computadores jogam a mesma fase juntos, um com o Fósforo e o outro com a Candela, e o progresso fica salvo nos dois.

1. Abra https://lucc4lim4-bot.github.io/cuphead/ nos dois aparelhos.
2. No primeiro: **Jogar online → Criar sala**, escolha o herói e anote o código de 4 números.
3. No segundo: **Jogar online → Entrar numa sala**, digite o código e toque em **Entrar**.
4. Quem criou a sala escolhe a fase no mapa; o outro pode abrir a loja enquanto espera.

Ao conectar, os saves se juntam (melhores notas, mais moedas e todos os itens comprados), e cada vitória conta nos dois aparelhos. A conexão é direta entre os aparelhos (WebRTC, via PeerJS); funciona melhor com os dois no mesmo Wi-Fi. Não funciona dentro do Artifact do claude.ai, só no site.

## Saves e dificuldade

- **3 slots de save.** Cada um guarda notas, moedas, itens, equipamento e a dificuldade. Para trocar de save ou começar um jogo novo: **Opções → Trocar de save** (no título). Para apagar um save: na tela de saves, aperte **atirar** duas vezes sobre ele. Saves da versão anterior são migrados para o slot 1.
- **A dificuldade é escolhida ao criar o save e fica travada.** Depois só dá para **baixar** (em Opções, com confirmação). A nota de cada chefão guarda em qual dificuldade foi conseguida, e o Fácil limita a nota máxima a B.

| Nível | Vida | Chefões |
|---|---|---|
| **Fácil** | 5 PV | HP ×0,95, ataques bem espaçados e projéteis lentos (nota máxima B) |
| **Normal** | 4 PV | HP ×1,28, ataques mais espaçados e projéteis um pouco mais lentos |
| **Difícil** | 3 PV | HP ×1,65, ritmo e velocidade quase originais |
| **Pesadelo** | 1 PV | HP ×1,95, mais agressivos |

Em todos os níveis os chefões têm bem mais vida e atacam menos vezes e mais devagar do que antes: cada ataque é mais fácil de ler, e a luta dura mais.

## Parry (rosa)

Os projéteis rosa não são mais fixos: cada ataque só define quais projéteis **podem** ser rosa, e um sorteio decide quando. Entre dois rosas passam no mínimo 3,5 s e no máximo 12,5 s (o "saco de rosas" garante que sempre apareçam), e eles surgem sempre à vista. Rebater dá +1 chama e 0,7 s de invulnerabilidade. A chama também enche ao causar dano. A nota de rebotes é proporcional aos rosas que apareceram na luta.

## Loja, inventário e moedas

- **Moedas:** a primeira vitória sobre cada chefão paga 4 moedas (mais bônus por nota alta e dificuldade) e repetir paga 1. Não existe mais moeda de consolação. Cada fase de moedas (Run 'n' Gun) tem 6 moedas que só podem ser pegas uma vez, mais 2 de bônus ao completá-la. Moedas = ganhas − preço dos itens comprados, então ninguém recupera moedas gastas ao reconectar online.
- **Loja rotativa do Seu Lampião:** 6 itens à vista. Ao comprar, o item sai e outro, que você ainda não tem, entra na hora. A 1ª vitória em cada fase também renova a vitrine. A ordem vem de uma semente do save (não adianta recarregar) e há sempre pelo menos uma arma e um amuleto à vista.
- **Inventário (tecla X no mapa):** cada herói leva **2 armas e 1 amuleto**. Troque de arma durante a luta com a tecla de troca (Q, ou o botão TROCA). O inventário aparece antes de cada luta, com **Lutar!** já selecionado.

| Item | Tipo | Preço | Efeito |
|---|---|---|---|
| Rajada Teleguiada | Arma | 4 | Faíscas que perseguem o chefão |
| Tiro Duplo | Arma | 5 | Duas faíscas paralelas |
| Leque de Cera | Arma | 4 | 3 gotas em leque, forte de perto |
| Bombinha | Arma | 5 | Bombas em arco com explosão |
| Coração Extra | Amuleto | 3 | +1 PV (tiro 5% mais fraco) |
| Cafezinho | Amuleto | 3 | Medidor de chamas enche sozinho |
| Bomba de Fumaça | Amuleto | 4 | Dash invencível |
| Ímã Rosa | Amuleto | 2 | Rebote mais fácil |
| Bolha Protetora | Amuleto | 5 | Absorve 1 golpe e volta em 25 s |
| Sapato de Mola | Amuleto | 4 | Pulo extra (a Candela ganha o terceiro) |

## Fases de moedas (Run 'n' Gun)

Três fases de corrida lateral, sem tempo limite, com poços, plataformas, inimigos comuns, corações, checkpoints e **6 moedas escondidas**. Cada uma termina num mini-boss simples de pouca vida: o Pombo Valentão (Telhados), o Tambor Trovão (Bastidores) e o Cuco Maluco (Engrenagem). Cair no poço custa 1 PV e leva ao último ponto seguro. Se todos caírem, o jogo volta ao checkpoint. Funcionam sozinho e em 2 jogadores no mesmo aparelho (ainda não funcionam online).

## Opções

No título ou na pausa, em **Opções**:

- Dificuldade (só desce), trocar de save, barra de vida do chefão, volume da música e dos efeitos, som geral, tremor de tela e efeito de filme antigo.
- **Botões de toque**: mostrar sempre, nunca ou automático; **opacidade**, **tamanho** e **posição** (modo de edição: arraste cada botão para onde quiser).
- **Direção na tela**: **joystick fixo**, **joystick flutuante** (aparece onde o polegar encosta no lado esquerdo da tela) ou **setas**. O joystick mira em 8 direções e também pode ser arrastado no modo de edição.
- **Teclas**: troque qualquer tecla do modo 1 jogador e de cada jogador do modo 2 jogadores.

## Controles

### 1 jogador

| Tecla | Ação |
|---|---|
| Setas / WASD | Andar, mirar (cima e diagonais), agachar |
| Z / Espaço | Pular (segure para ir mais alto) |
| Z no ar | **Fósforo**: rebate objetos **rosa** e quica neles (+1 chama). Candela rebate com o **dash** |
| X | Atirar |
| C | Dash (também no ar) |
| V | Golpe EX (1 chama) · Super *Labareda* (5 chamas) |
| Shift | Travar a posição para mirar |
| Q | Trocar de arma |
| X no mapa | Abrir o inventário |
| Esc / P | Pausar · M liga/desliga o som |

### 2 jogadores

| | Mover | Pular | Atirar | Dash | EX | Travar |
|---|---|---|---|---|---|---|
| Jogador 1 | WASD | F / Espaço | G | H | R | Q |
| Jogador 2 | Setas | Num1 ou `,` | Num2 ou `.` | Num3 ou `/` | Num0 ou L | Shift direito |

Controles (gamepads) também funcionam: controle 1 = J1, controle 2 = J2 (A pular, X atirar, RB dash, B EX, LT travar, Start pausa).

Em celulares aparecem um joystick virtual e botões na tela (1 jogador).

Ao vencer, você recebe uma nota (D até S) calculada pelo tempo, pela vida restante, pelos rebotes e pelas chamas usadas. O progresso fica salvo no navegador.

## Como rodar

O jogo é todo estático (HTML, CSS e JavaScript puro, sem dependências):

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

### GitHub Pages

O workflow `.github/workflows/pages.yml` publica o site a cada push na `main`.
Endereço: https://lucc4lim4-bot.github.io/cuphead/

Se for a primeira vez, ative em **Settings → Pages → Build and deployment → Source: GitHub Actions** e rode o workflow de novo (aba **Actions**).

## Estrutura

- `index.html`: página e controles de toque
- `css/style.css`: layout responsivo
- `js/engine.js`: entrada, utilidades de desenho, partículas, efeito de filme
- `js/audio.js`: efeitos sonoros e música procedural (Web Audio)
- `js/art.js`: desenho dos heróis (Fósforo e Candela)
- `js/player.js`: heróis jogáveis (movimento, armas, dash, rebote, EX, Super e reviver)
- `js/bosses.js`: projéteis e comportamento dos três chefões
- `js/boss-art.js`: desenho detalhado dos chefões 1 a 3
- `js/bosses2.js`: chefões 4 a 6 (comportamento, arte e cenários)
- `js/shop.js`: loja rotativa, inventário, moedas e itens
- `js/boss-fx.js`: efeitos de ambiente e risadas dos chefões
- `js/net.js`: jogo online (salas, conexão, save em conjunto)
- `js/rungun.js`: fases Run 'n' Gun, inimigos e mini-bosses
- `js/options.js`: telas de opções, saves e troca de teclas
- `js/scenes.js`: cenários, luta, título, seleção de personagem, história, mapa e resultados
- `js/main.js`: laço principal e transições
