# Fósforo e a Chama Perdida

Jogo de navegador original no estilo dos desenhos animados dos anos 1930: um *boss rush* de tiro e plataforma com visual "rubber hose", grão de filme antigo e trilha de ragtime gerada na hora.

## História

Em Vila Vinil, a Chama Eterna do Farol se apagou e três brasas mágicas foram roubadas. **Fósforo**, o aprendiz do faroleiro, precisa derrotar três figurões para recuperá-las e reacender o Farol:

1. **Gramofone Gustavo**, no Salão de Música: notas musicais, discos que rolam e saltos com onda de choque.
2. **Nuvem Nimbo**, nos Telhados: chuva, raios teleguiados, nuvenzinhas perseguidoras, granizo e ventania.
3. **Rei Relógio**, na Torre: engrenagens, espirais de ponteiros, um pêndulo gigante e o cuco que joga ovos.

## Controles

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

Em celulares aparecem botões na tela.

Ao vencer, você recebe uma nota (D até S) calculada pelo tempo, pela vida restante, pelos rebotes e pelas chamas usadas. O progresso fica salvo no navegador.

## Como rodar

O jogo é todo estático (HTML, CSS e JavaScript puro, sem dependências):

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

Também funciona no GitHub Pages: publique a branch e use a raiz como pasta do site.

## Estrutura

- `index.html`: página e controles de toque
- `css/style.css`: layout responsivo
- `js/engine.js`: entrada, utilidades de desenho, partículas, efeito de filme
- `js/audio.js`: efeitos sonoros e música procedural (Web Audio)
- `js/player.js`: o Fósforo (movimento, tiro, dash, rebote, EX e Super)
- `js/bosses.js`: projéteis e os três chefões
- `js/scenes.js`: cenários, luta, título, história, mapa e resultados
- `js/main.js`: laço principal e transições
