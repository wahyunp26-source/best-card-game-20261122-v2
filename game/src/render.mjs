// Ember Court — the DOM table. Turns a game snapshot into the screen:
// rival HP bar + shield + intent badge + card backs, the log, the
// player's HP bar, ember pips, and the hand of real cards.

import { SUITS, mainNumber } from './cards.mjs';

const $ = (id) => document.getElementById(id);

function hpWidth(hp, maxHp) {
  return `${Math.max(0, Math.min(100, (hp / maxHp) * 100))}%`;
}

export function cardEl(card, game) {
  const suit = SUITS[card.suit];
  const el = document.createElement('div');
  el.className = 'card';
  el.dataset.uid = card.uid;
  const affordable = card.cost <= game.player.embers;
  el.classList.add(affordable ? 'playable' : 'unaffordable');
  const court = game.courtSuits.includes(card.suit) && mainNumber(card) > 0;
  const bonus = court ? ' <span class="court-badge">COURT +2</span>' : '';
  el.style.borderTop = `6px solid ${suit.color}`;
  el.innerHTML =
    `<div class="cost">${card.cost}</div>` +
    `<div class="suit-glyph" style="color:${suit.color}">${suit.glyph}</div>` +
    `<div class="suit-name" style="color:${suit.color}">${suit.name}</div>` +
    `<div class="card-name">${card.name}</div>` +
    `<div class="card-text">${card.text}</div>` +
    bonus;
  return el;
}

export function renderTable(game) {
  const snap = game.snapshot;
  // Rival row.
  $('rival-hp-fill').style.width = hpWidth(snap.rival.hp, snap.rival.maxHp);
  $('rival-hp-num').textContent = `${snap.rival.hp} / ${snap.rival.maxHp} ♥`;
  $('rival-shield').textContent = snap.rival.shield > 0
    ? `🛡 ${snap.rival.shield} shield` : '';
  const backs = $('rival-hand');
  backs.innerHTML = '';
  for (let i = 0; i < snap.rival.handCount; i++) {
    const b = document.createElement('div');
    b.className = 'card-back';
    b.textContent = '♛';
    backs.appendChild(b);
  }
  // Intent badge: what the Regent announced it will do.
  const intent = $('intent-badge');
  if (snap.intent) {
    intent.innerHTML = `⚔ Next: ${snap.intent.text}`;
  } else {
    intent.textContent = 'The Regent is thinking…';
  }
  // Player row.
  $('player-hp-fill').style.width = hpWidth(snap.player.hp, snap.player.maxHp);
  $('player-hp-num').textContent = `${snap.player.hp} / ${snap.player.maxHp} ♥`;
  $('player-shield').textContent = snap.player.shield > 0
    ? `🛡 ${snap.player.shield} shield` : '';
  // Ember pips.
  const pips = $('ember-pips');
  pips.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const p = document.createElement('div');
    p.className = 'pip' + (i < snap.player.embers ? ' full' : '');
    p.textContent = i < snap.player.embers ? '●' : '○';
    pips.appendChild(p);
  }
  // Court line: which suits already earned the +2 this turn.
  const court = $('court-line');
  if (snap.courtSuits.length) {
    court.innerHTML = 'Court this turn: ' + snap.courtSuits.map((s) =>
      `<span class="on">${SUITS[s].glyph} ${SUITS[s].name} +2</span>`).join(' · ');
  } else {
    court.textContent = 'Court: play a second card of one suit for +2.';
  }
  // The hand.
  const hand = $('hand');
  hand.innerHTML = '';
  for (const card of snap.player.hand) {
    hand.appendChild(cardEl(card, snap));
  }
  // The log, newest first.
  const log = $('log');
  log.innerHTML = '';
  for (const line of snap.log.slice().reverse()) {
    const d = document.createElement('div');
    d.textContent = line;
    log.appendChild(d);
  }
  // Turn banner.
  const banner = $('turn-banner');
  banner.textContent = snap.phase === 'play'
    ? `TURN ${snap.turnCount}\nYOUR MOVE` : '';
  // End Turn is only live on the player's turn.
  $('end-turn').disabled = snap.phase !== 'play' || snap.turn !== 'player';
  // Floaters from the last plays.
  for (const ev of snap.events) {
    spawnFloater(ev);
  }
}

function spawnFloater(ev) {
  const layer = $('floaters');
  if (!layer) return;
  const el = document.createElement('div');
  el.className = `floater ${ev.kind}`;
  el.textContent = ev.text;
  // Damage lands on the target's life bar: the rival's is top-left,
  // the player's bottom-left.
  if (ev.side === 'rival') { el.style.left = '120px'; el.style.top = '96px'; }
  else { el.style.left = '120px'; el.style.top = '560px'; }
  layer.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

export function showScreen(name) {
  for (const id of ['title-screen', 'table-screen', 'end-screen']) {
    $(id).classList.toggle('on', id === name);
  }
}

export function renderEnd(game) {
  const snap = game.snapshot;
  const won = snap.phase === 'won';
  const screen = $('end-screen');
  screen.className = 'screen on ' + (won ? 'win' : 'lost');
  $('end-title').textContent = won ? '👑 VICTORY!' : '💀 DEFEATED';
  $('end-sub').textContent = won
    ? 'The Ashen Regent bows. The Ember Court is yours.'
    : 'The Ashen Regent keeps the throne… this time.';
  $('stat-turns').textContent = snap.stats.turns;
  $('stat-cards').textContent = snap.stats.cardsPlayed;
  $('stat-damage').textContent = snap.stats.damageDealt;
  $('stat-taken').textContent = snap.stats.damageTaken;
  if (won) fireConfetti();
}

function fireConfetti() {
  const layer = $('confetti');
  if (!layer) return;
  layer.innerHTML = '';
  const colors = ['#ffd97a', '#ff6b6b', '#69db7c', '#74c0fc', '#e599f7', '#ffa94d'];
  for (let i = 0; i < 90; i++) {
    const bit = document.createElement('div');
    bit.className = 'confetti-bit';
    bit.style.left = `${Math.random() * 100}%`;
    bit.style.background = colors[i % colors.length];
    bit.style.animationDuration = `${1.6 + Math.random() * 1.8}s`;
    bit.style.animationDelay = `${Math.random() * 0.6}s`;
    layer.appendChild(bit);
  }
  setTimeout(() => { layer.innerHTML = ''; }, 4500);
}

export function flashBanner() {
  const banner = $('turn-banner');
  banner.classList.remove('flash');
  void banner.offsetWidth; // restart the animation
  banner.classList.add('flash');
}
