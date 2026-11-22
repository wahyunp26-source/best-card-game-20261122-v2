[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![Rank](https://make.fun/badge/best-card-game-20261122-1826/rank/wahyunp26-source/best-card-game-20261122-v2.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![Reward](https://make.fun/badge/best-card-game-20261122-1826/reward/wahyunp26-source/best-card-game-20261122-v2.svg)](https://make.fun/c/best-card-game-20261122-1826)

# 👑 Ember Court — a duel of cards

A complete, original turn-based card battler for the [make.fun best card game bounty](https://make.fun/c/best-card-game-20261122-1826). You are the Challenger (30 life) against the Ashen Regent (45 life) — a boss who announces its next move, so every hand is a read-and-counter decision.

## How to play

Open `game/index.html` in a desktop browser (no build, no network, no libraries).

- **Embers are mana:** +3 a turn, cap 6, unspent carries.
- **24 cards, 4 suits** — Ember ▲ damage, Tide ● heal/shield, Thorn ◆ lingering hurt, Gale ★ draw/embers. Suits are told apart by colour **and** shape.
- **⚜ Court rule:** the second card of one suit in a turn gets **+2** — chain a suit to hit harder.
- **The Regent announces its intent** before your turn (heal when hurt, finish when you're at ≤8 life, best damage otherwise). Shield up before a big hit lands.
- **Burn & Thorn** tick at the start of the afflicted side's turn, then fade. **Snare** weakens the foe's next attack by 3.
- Click a card to play it (keys **1–7**), **E / Space** ends the turn, **Enter / R** starts or restarts.

Win by dropping the Regent to 0 life. Lose at 0 life — the end screen shows turns, cards played, damage dealt and taken.

## Balance (simulated, 500 games each)

| Player | Win rate |
| --- | --- |
| Greedy bot (best-value card every time) | 45.4% |
| Random bot | 0% |
| Never plays a card | 0% |

Decisions matter: a thoughtful player who reads intents and times shields beats the greedy bot; a careless one loses.

## Layout

- `game/src/cards.mjs` — the 24-card catalogue and suits
- `game/src/engine.mjs` — pure rules: turns, embers, court bonus, damage, win/loss
- `game/src/rival.mjs` — the Regent's intent policy + auto-player for tests
- `game/src/render.mjs` — the DOM table, floaters, end screens, confetti
- `game/src/input.mjs` — mouse + keyboard
- `game/src/sfx.mjs` — WebAudio blips, no files
- `game/src/shots.mjs` — screenshot demo states + in-page self-test (`?selftest=1`)
- `game/src/main.mjs` — boot and turn flow
- `main.ts` — hands game/ + screenshots/ to make.fun with a dossier

## Screenshots

Real renders of the game's own code (`?shot=table|title|win|loss&seed=7`): the table, the title screen, the win screen, the loss screen.
