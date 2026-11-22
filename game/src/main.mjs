// Ember Court — boot and turn flow. Owns the game object, wires the
// input handlers to the engine, and refreshes the screen after every move.

import { newGame, startGame, playCard, endPlayerTurn, checkEnd, snapshot, playable } from './engine.mjs';
import { planRival } from './rival.mjs';
import { renderTable, renderEnd, showScreen, flashBanner } from './render.mjs';
import { bindInput } from './input.mjs';
import { sfx } from './sfx.mjs';
import { applyShot, selfTest, params } from './shots.mjs';

window.__errors = [];
window.addEventListener('error', (ev) => window.__errors.push(String(ev.message)));

// One 1280x800 stage, scaled to fit any window.
function fitStage() {
  const stage = document.getElementById('stage');
  const s = Math.min(window.innerWidth / 1280, window.innerHeight / 800);
  stage.style.transform = `scale(${s})`;
}
window.addEventListener('resize', fitStage);
fitStage();

let game = newGame(7);

function refresh(screen) {
  game.snapshot = snapshot(game);
  if (screen === 'title') { showScreen('title-screen'); return; }
  if (screen === 'end') {
    showScreen('end-screen');
    renderEnd(game);
    return;
  }
  showScreen('table-screen');
  renderTable(game);
}

function finishIfOver() {
  if (game.phase === 'won' || game.phase === 'lost') {
    game.snapshot = snapshot(game);
    showScreen('end-screen');
    renderEnd(game);
    if (game.phase === 'won') sfx.win(); else sfx.lose();
    return true;
  }
  return false;
}

function startNewGame() {
  const seed = (Math.random() * 1e9) | 0;
  game = newGame(seed);
  startGame(game);
  game.intent = planRival(game);
  sfx.turn();
  refresh('table');
  flashBanner();
}

function onPlayCard(uid) {
  if (game.phase !== 'play' || game.turn !== 'player') return;
  const card = game.player.hand.find((c) => c.uid === uid);
  if (!card) return;
  if (!playable(game, card)) { sfx.denied(); return; }
  const wasDamage = (card.effect.dmg || 0) > 0;
  const wasHeal = (card.effect.heal || 0) > 0;
  const wasShield = (card.effect.shield || 0) > 0;
  playCard(game, game.player, game.rival, uid, 'player');
  if (wasDamage) sfx.hit();
  else if (wasHeal) sfx.heal();
  else if (wasShield) sfx.shield();
  else sfx.play();
  if (!finishIfOver()) refresh('table');
}

function onEndTurn() {
  if (game.phase !== 'play' || game.turn !== 'player') return;
  const uids = game.intent ? game.intent.uids : [];
  endPlayerTurn(game, uids, null);
  if (finishIfOver()) return;
  game.intent = planRival(game);
  sfx.turn();
  refresh('table');
  flashBanner();
}

function onPlayIndex(i) {
  if (game.phase !== 'play' || game.turn !== 'player') return;
  const card = game.player.hand[i];
  if (card) onPlayCard(card.uid);
}

bindInput({
  onStart: startNewGame,
  onPlayCard,
  onEndTurn,
  onPlayIndex,
});

// Demo states for screenshots, or the title screen for real play.
const shot = applyShot(game, refresh);
if (params().get('selftest') === '1') {
  void selfTest();
} else if (!shot) {
  refresh('title');
}
