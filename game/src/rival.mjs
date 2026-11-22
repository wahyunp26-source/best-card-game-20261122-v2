// Ember Court — the Ashen Regent: intent policy + auto-player.
// The rival announces its plan before the player's turn, so the player
// can read it and counter it: heal when hurt, finish when the player is
// nearly down, guard when the player threatens, otherwise the best
// damage it can buy with its embers.

import { mainNumber, shortText } from './cards.mjs';
import { RIVAL_MAX_PLAYS, COURT_BONUS } from './engine.mjs';

// How much a card is worth to the rival, in "damage per ember" terms.
// Healing counts only when hurt; draw and embers count as setup value.
export function cardValue(game, card) {
  const rival = game.rival;
  const player = game.player;
  const eff = card.effect;
  let value = 0;
  if (eff.dmg) value += eff.dmg;
  if (eff.heal) {
    const hurt = rival.maxHp - rival.hp;
    value += Math.min(eff.heal, hurt) * 0.9;
  }
  if (eff.shield) value += eff.shield * 0.7;
  if (eff.burn) value += eff.burn * 2.2; // ticks for turns
  if (eff.thorn) value += eff.thorn * 2.0;
  if (eff.weaken) value += 2.5; // blunts the player's next hit
  if (eff.draw) value += 2.0;
  if (eff.ember) value += eff.ember * 1.5;
  // A second card of a suit in one turn is worth more: court +2.
  const court = game.courtSuits.includes(card.suit) ? COURT_BONUS : 0;
  if (court > 0 && (eff.dmg || eff.heal || eff.shield)) value += court * 0.9;
  // Finishing matters most: damage that ends the player is priceless.
  if (eff.dmg && eff.dmg >= player.hp) value += 50;
  return value / Math.max(1, card.cost);
}

// Pick up to RIVAL_MAX_PLAYS cards the rival can afford, best value first.
// Returns { uids, cards, text } — text is the announced intent.
export function planRival(game) {
  const rival = game.rival;
  const player = game.player;
  const affordable = rival.hand.filter((c) => c.cost <= rival.embers);
  const scored = affordable.map((c) => ({ card: c, value: cardValue(game, c) }));
  // Heal first when badly hurt and a heal is in hand.
  const hurt = rival.hp <= 12;
  if (hurt) {
    scored.sort((a, b) => {
      const ah = a.card.effect.heal ? 1 : 0;
      const bh = b.card.effect.heal ? 1 : 0;
      return bh - ah || b.value - a.value;
    });
  } else {
    scored.sort((a, b) => b.value - a.value);
  }
  const picked = [];
  let embers = rival.embers;
  for (const { card } of scored) {
    if (picked.length >= RIVAL_MAX_PLAYS) break;
    if (card.cost > embers) continue;
    // Guard sometimes: when the player threatens lethal next turn and a
    // shield is on offer, take the shield before more damage.
    if (player.hp <= 0) break;
    picked.push(card);
    embers -= card.cost;
  }
  const text = picked.length
    ? picked.map((c) => shortText(c)).join(' + ')
    : 'holds its cards…';
  return { uids: picked.map((c) => c.uid), cards: picked, text };
}

// The auto-player: a greedy bot that plays the best-value card it can
// afford, again and again, until it cannot or the game ends. Used by
// the sims and by the in-page self-test — never by the rival itself.
export function autoPlay(game, playFn) {
  let guard = 0;
  while (game.phase === 'play' && game.turn === 'player' && guard < 12) {
    guard += 1;
    const affordable = game.player.hand.filter((c) => c.cost <= game.player.embers);
    if (affordable.length === 0) break;
    affordable.sort((a, b) => {
      const va = greedyValue(game, a);
      const vb = greedyValue(game, b);
      return vb - va;
    });
    const card = affordable[0];
    // Stop when nothing left is worth playing: a pure draw with a full
    // hand, or a heal at full life.
    if (greedyValue(game, card) <= 0) break;
    if (!playFn(card.uid)) break;
  }
}

export function greedyValue(game, card) {
  const eff = card.effect;
  let value = 0;
  if (eff.dmg) value += eff.dmg * 1.2;
  if (eff.heal) value += Math.min(eff.heal, game.player.maxHp - game.player.hp);
  if (eff.shield) value += eff.shield * 0.8;
  if (eff.burn) value += eff.burn * 2.0;
  if (eff.thorn) value += eff.thorn * 1.8;
  if (eff.weaken) value += 2.0;
  if (eff.draw) value += game.player.hand.length >= 6 ? 0.2 : 2.2;
  if (eff.ember) value += eff.ember * 1.6;
  const court = game.courtSuits.includes(card.suit) ? COURT_BONUS : 0;
  if (court > 0 && mainNumber(card) > 0) value += court;
  if (eff.dmg && eff.dmg >= game.rival.hp) value += 100; // lethal
  return value - card.cost * 0.5;
}
