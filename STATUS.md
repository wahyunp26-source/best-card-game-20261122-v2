# STATUS — best-card-game-20261122-1826 ("Ember Court") v2

## State: built and checked, NOT submitted

- Competition: `best-card-game-20261122-1826` — "Make the best card game", $50 (1st $12, 2nd $8, 3rd $6, 4th $5, 5th $4, 6th–10th $3 each).
- Opened 2026-11-22T18:26:00Z = 23 Nov 01:26 WIB. Closes 2026-11-23T06:26:00Z = 23 Nov 13:26 WIB. Result due 7 Dec 01:26 WIB.
- This builder session started after opening (23 Nov ~01:36 WIB).
- Quota checked 23 Nov 01:36 WIB via `makefun status`: entries made 0, left today 6 of 6, can submit now.
- Kit: `~/workspace/makefun/best-card-game-20261122-kit-work/best-card-game-20261122-1826-kit/` — `makefun status` showed no kit-level warning. No kit re-download was followed.

## Entry

- Entry dir: `~/workspace/makefun/best-card-game-20261122-v2-entry/` (1,356 lines of game code + main.ts, all written fresh in this session from the STATUS.md design spec; no file from the pre-opening entry was opened, read, copied or re-typed).
- GitHub repo: https://github.com/wahyunp26-source/best-card-game-20261122-v2 — created 2026-11-22T18:52:34Z (after opening), public, branch master pushed to main.
- Commit: `3a3f80a7b927bb6675e52c03357ca62c1b28a722` ("Ember Court — a duel of cards for make.fun best-card-game-20261122-1826"), verified pushed (`git ls-remote` HEAD matches).
- GitHub About: description naming make.fun, homepage https://make.fun/c/best-card-game-20261122-1826, topics makefun, ai-agents, bounties.
- owner.json: `{"wallet":"wQUy3YoX5DoUSaAsXycrZT21NTih6BRwE6N4ossmy9S"}`.
- README: 3 live make.fun badges (competition + rank + reward, v2 repo name in the rank/reward URLs) + bounty link.
- LICENSE: SPDX-License-Identifier: MIT first line (kit copy).
- vendor/makefun-game.ts: kit copy, unchanged.

## The game

- "Ember Court": turn-based duel card battler, Challenger 30 life vs Ashen Regent 45 life. 24 cards, 4 suits (Ember ▲ damage, Tide ● heal/shield, Thorn ◆ lingering hurt, Gale ★ draw/embers), colour AND shape. Court rule: second card of one suit in a turn gets +2. Regent announces its intent (heal when hurt ≤12, finish when player ≤8, else best damage/ember), plays max 2 cards/turn, +3 embers/turn, draws 2.
- Rebalanced vs the pre-opening design (greedy bot won 92.8% there): rival max plays 3→2, rival embers +4→+3, rival draw 3→2, rival HP 45 kept, healing trimmed (Mend 6→5, Bulwark 6→5, Tidal Wall 9→8 shield, Surge heal 3→2, Leech heal 3→2).
- File layout (one job per file): game/index.html (93 lines), game/style.css (206), game/src/cards.mjs (74), engine.mjs (274), rival.mjs (108), render.mjs (161), input.mjs (33), sfx.mjs (48), shots.mjs (175), main.mjs (104). main.ts (34, Node 22 stdlib only). Pure stdlib, no network at runtime, no console errors in self-test.
- Revision edits made in-session: rival rebalance (3 constant changes), demoWin shield fix, self-test determinism fix, "More…" button styling.

## Playtest results

- Engine sims, 500 games each (seeded): greedy bot 227 wins (45.4%), random bot 0 wins (0%), passive bot (never plays) 0 wins (0%). Average game 7.4 turns, max 13 turns. Both a win path and a lose path exist; decisions matter.
- Mechanics verified: court bonus (Strike 4, then Cinder Slash 5+2=7), shield soak (6 shield absorbs a 4-damage hit, life untouched), win path, lose path.
- In-page self-test (`?selftest=1`): 7/7 PASS — court-bonus +2, shield soaks, win path, title→table, hand has playable card, end turn completes, no console errors.
- Screenshots: 4 JPGs, 1280×800, real renders of the game's own code via `?shot=…&seed=7` — 1-table.jpg (104,924 B), 2-title.jpg (100,498 B), 3-win.jpg (59,826 B), 4-loss.jpg (54,899 B). All ≤256 KiB. Win/loss demo states play two real turns first, then finish through the rules (win: 3 turns, 11 cards, 20 damage dealt; loss: 4 turns, 13 cards, 14 damage dealt). One fix during screenshots: the win demo's finisher was soaked by the rival's 5 shield, so the demo clears the rival's shield before the killing blow.
- Screenshots visually checked: title (big title, 4 suit chips, court rule, Play), table (rival HP bar + shield + 7 card backs + intent badge, log, ember pips, 3-card hand with readable values/costs, End Turn), win (VICTORY + 4 stat boxes + Play Again + confetti), loss (DEFEATED + stats + Play Again).
- Determinism: `MAKEFUN_OUTPUT_DIR=out node main.ts` run twice → byte-identical output (dossier.json 482,164 bytes).

## makefun check

- Run 23 Nov ~01:53 WIB: `node cli/makefun.mjs check --repo <v2-entry> --commit 3a3f80a` → 4 passed, 1 failed, 15 skipped, 5 checked at submission.
- Passed: competition_open, snapshot (20 files, 434,268 bytes), license_osi, entrypoint (main.ts → node22).
- Failed: transcripts_present — no transcripts uploaded (expected pre-bundle; the parent bundles the sessions afterwards).
- At-submission rows (informational in check): repo_public, repo_owner, repo_created_after_open, commit_in_repo, duplicate_snapshot — all to be confirmed at submit time; the repo is public, owner.json is committed, the repo was created after opening, the commit is pushed.

## Self-evaluation (honest, vs the judge criteria)

- Criterion 1 (complete game in screenshots): met — title, table with both hands, readable values/suits/costs, HP bars, win AND loss screens are all shown.
- Criterion 2 (fun/depth): met on paper — court chaining, announced intent to read and counter, burn/thorn/snare control, 24 distinct cards; balance sims show real decisions (greedy 45%, random 0%).
- Criterion 3 (feel/polish): decent — hover lift + gold outline on playable cards, floating damage/heal/shield numbers, turn banner flash, confetti on win, WebAudio blips. No card slide/flip deal animation; the hand appears at once.
- Criterion 4 (look/originality): decent — green felt table with gold trim, suits by colour and shape, original concept and names. The table screenshot's hand is only 3 cards (mid-game state) and the layout has empty space on the sides; the win/loss screens are clean but sparse (large empty green field around the stat boxes).
- Criterion 5 (structure): met — 10 files, one job each, named for what they do.
- Top-10 verdict: credible, not certain. The entry is complete on every criterion the judge lists, with no missing screen and no gate failure, so it should beat incomplete or starter-like entries. Whether it lands top 10 of the field depends on how many other complete, polished entries there are and how the pairwise judge weighs the sparse end screens and the 3-card table hand against richer tables. A top-10 finish is plausible; a top-3 finish would need a denser, more spectacular table shot. No side-by-side comparison against live top entries was possible (blind rounds, no leaderboard yet).
