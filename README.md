# Fósforo & Candela e a Chama Perdida

Jogo de navegador original no estilo dos desenhos animados dos anos 1930: um *boss rush* de tiro e plataforma com visual "rubber hose", grão de filme antigo e trilha de ragtime gerada na hora.

## História

Em Vila Vinil, a Chama Eterna do Farol se apagou e três brasas mágicas foram roubadas. **Fósforo**, o aprendiz do faroleiro, e sua amiga **Candela** precisam derrotar três figurões para recuperá-las e reacender o Farol:

1. **Gramofone Gustavo**, no Salão de Música: notas musicais, discos que rolam e saltos com onda de choque.
2. **Nuvem Nimbo**, nos Telhados: chuva, raios teleguiados, nuvenzinhas perseguidoras, granizo e ventania.
3. **Rei Relógio**, na Torre: engrenagens, espirais de ponteiros, um pêndulo gigante e o cuco que joga ovos.

## Personagens

| Herói | Arma | Estilo |
|---|---|---|
| **Fósforo**, o palito destemido | Faíscas | Tiro rápido, reto e de longo alcance |
| **Candela**, a velinha valente | Leque de Cera | Três gotas em leque: curto alcance, forte de perto |

## Modos

- **1 Jogador**: escolha Fósforo ou Candela.
- **2 Jogadores** (cooperativo local): cada um controla um herói. Quem perder toda a vida vira fantasma; o parceiro **rebate o coração rosa** do fantasma para revivê-lo. Os chefões ficam mais resistentes.

## Controles

### 1 jogador

| Tecla | Ação |
|---|---|
| Setas / WASD | Andar, mirar (cima e diagonais), agachar |
| Z / Espaço | Pular (segure para ir mais alto) |
| Z no ar | **Rebote**: toque em objetos **rosa** para quicar e ganhar 1 chama |
| X | Atirar |
| C | Dash (também no ar) |
| V | Golpe EX (1 chama) · Super *Labareda* (5 chamas) |
| Shift | Travar a posição para mirar |
| Esc / P | Pausar · M liga/desliga o som |

### 2 jogadores

| | Mover | Pular | Atirar | Dash | EX | Travar |
|---|---|---|---|---|---|---|
| Jogador 1 | WASD | F / Espaço | G | H | R | Q |
| Jogador 2 | Setas | Num1 ou `,` | Num2 ou `.` | Num3 ou `/` | Num0 ou L | Shift direito |

Controles (gamepads) também funcionam: controle 1 = J1, controle 2 = J2 (A pular, X atirar, RB dash, B EX, LT travar, Start pausa).

Em celulares aparecem botões na tela (1 jogador).

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
- `js/boss-art.js`: desenho detalhado dos chefões
- `js/scenes.js`: cenários, luta, título, seleção de personagem, história, mapa e resultados
- `js/main.js`: laço principal e transições
