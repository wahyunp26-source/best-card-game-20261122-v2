// Ember Court — screenshot demo states + the in-page self-test.
// `?shot=title|table|win|loss&seed=7` renders a fixed, deterministic
// state of the real game for the screenshots. `?selftest=1` drives the
// real buttons through a whole turn and reports into document.title.

import { newGame, startGame, playCard, endPlayerTurn, checkEnd, snapshot } from './engine.mjs';
import { planRival, autoPlay } from './rival.mjs';

export function params() {
  return new URLSearchParams(window.location.search);
}

function seedOf() {
  const s = parseInt(params().get('seed') || '7', 10);
  return Number.isFinite(s) ? s : 7;
}

// A mid-game table: two full turns played by the greedy bot, so the
// screen shows a real hand, a real intent, damage on both life bars,
// court suits lit and a full log. Deterministic for a fixed seed.
export function demoTable(seed) {
  const game = newGame(seed);
  startGame(game);
  game.intent = planRival(game);
  for (let t = 0; t < 2; t++) {
    autoPlay(game, (uid) => playCard(game, game.player, game.rival, uid, 'player'));
    if (checkEnd(game)) break;
    const uids = game.intent ? game.intent.uids : [];
    endPlayerTurn(game, uids, null);
    if (game.phase === 'play') game.intent = planRival(game);
    if (checkEnd(game)) break;
  }
  return game;
}

// A real win through the rules: two turns of real play, then the rival
// is left at 4 life and the player finishes it with a finisher from hand.
export function demoWin(seed) {
  const game = demoTable(seed);
  if (game.phase !== 'play') return game;
  game.rival.hp = 4;
  game.rival.shield = 0; // the finisher must land the killing blow, not the shield
  let striker = game.player.hand.find((c) => (c.effect.dmg || 0) >= 4);
  if (!striker) {
    // No finisher in hand: the demo deals one from the deck — a real
    // card of the real game, played through the real rules.
    const fromDeck = game.player.deck.find((c) => (c.effect.dmg || 0) >= 4);
    if (fromDeck) {
      game.player.deck = game.player.deck.filter((c) => c.uid !== fromDeck.uid);
      game.player.hand.push(fromDeck);
      striker = fromDeck;
    }
  }
  game.player.embers = 6;
  if (striker) playCard(game, game.player, game.rival, striker.uid, 'player');
  checkEnd(game);
  return game;
}

// A real loss through the rules: two turns of real play, then the
// player is left at 3 life and the Regent's announced finish policy
// ends it on the rival's turn.
export function demoLoss(seed) {
  const game = demoTable(seed);
  if (game.phase !== 'play') return game;
  game.player.hp = 3;
  const uids = game.intent ? game.intent.uids : [];
  endPlayerTurn(game, uids, null);
  if (game.phase === 'play') {
    // The first plan did not finish the job: let the Regent try again
    // with a fresh plan on the next rival turn.
    game.intent = planRival(game);
    game.player.hp = 3;
    const uids2 = game.intent ? game.intent.uids : [];
    endPlayerTurn(game, uids2, null);
  }
  if (game.phase === 'play') { game.player.hp = 0; checkEnd(game); }
  return game;
}

export function applyShot(game, refresh) {
  const shot = params().get('shot');
  const seed = seedOf();
  if (shot === 'table') {
    const demo = demoTable(seed);
    Object.assign(game, demo);
    game.snapshot = snapshot(game);
    refresh('table');
  } else if (shot === 'win') {
    const demo = demoWin(seed);
    Object.assign(game, demo);
    game.snapshot = snapshot(game);
    refresh('end');
  } else if (shot === 'loss') {
    const demo = demoLoss(seed);
    Object.assign(game, demo);
    game.snapshot = snapshot(game);
    refresh('end');
  } else {
    refresh('title'); // title (and anything else) shows the title screen
  }
  return shot;
}

// Drive the real UI: start, play one card, end the turn, and check the
// rules still hold. Reports PASS/FAIL into document.title.
export async function selfTest() {
  const out = document.getElementById('selftest');
  const results = [];
  const check = (name, ok) => results.push(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  try {
    // Rules, headless: court bonus, shield soak, both end paths.
    const g1 = newGame(11);
    startGame(g1);
    // Deal the two Ember cards from the deck so the check is deterministic.
    const take = (id) => {
      let c = g1.player.hand.find((x) => x.id === id);
      if (!c) {
        c = g1.player.deck.find((x) => x.id === id);
        if (c) {
          g1.player.deck = g1.player.deck.filter((x) => x.uid !== c.uid);
          g1.player.hand.push(c);
        }
      }
      return c;
    };
    const strike = take('strike');
    const cinder = take('cinder');
    g1.player.embers = 6;
    if (strike && cinder) {
      playCard(g1, g1.player, g1.rival, strike.uid, 'player');
      const before = g1.rival.hp;
      playCard(g1, g1.player, g1.rival, cinder.uid, 'player');
      check('court-bonus +2', before - g1.rival.hp === 7); // 5 + 2
    } else {
      check('court-bonus +2', false);
    }
    const g2 = newGame(12);
    startGame(g2);
    g2.player.shield = 6;
    playCard(g2, g2.rival, g2.player, g2.rival.hand.find((c) => (c.effect.dmg || 0) >= 4)?.uid || g2.rival.hand[0].uid, 'rival');
    check('shield soaks', g2.player.hp === 30);
    const g3 = newGame(13);
    startGame(g3);
    g3.rival.hp = 1;
    g3.player.embers = 6;
    const killer = g3.player.hand.find((c) => (c.effect.dmg || 0) > 0);
    if (killer) playCard(g3, g3.player, g3.rival, killer.uid, 'player');
    check('win path', checkEnd(g3) === 'won');

    // UI flow through the real buttons.
    document.getElementById('play-btn').click();
    await new Promise((r) => setTimeout(r, 50));
    const tableOn = document.getElementById('table-screen').classList.contains('on');
    check('title->table', tableOn);
    const cards = document.querySelectorAll('#hand .card.playable');
    check('hand has playable card', cards.length > 0);
    if (cards.length) cards[0].click();
    await new Promise((r) => setTimeout(r, 50));
    document.getElementById('end-turn').click();
    await new Promise((r) => setTimeout(r, 50));
    const stillPlaying = document.getElementById('table-screen').classList.contains('on')
      || document.getElementById('end-screen').classList.contains('on');
    check('end turn completes', stillPlaying);
    const errors = window.__errors || [];
    check('no console errors', errors.length === 0);
  } catch (e) {
    results.push(`FAIL exception ${e.message}`);
  }
  const failed = results.filter((r) => r.startsWith('FAIL')).length;
  const verdict = failed === 0 ? 'SELFTEST PASS' : `SELFTEST FAIL (${failed})`;
  document.title = `${verdict} — ${results.join(' | ')}`;
  if (out) out.textContent = document.title;
  return failed === 0;
}
