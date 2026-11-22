// Ember Court — the rules engine. Pure logic, no DOM, no network.
// Node-testable: `node --input-type=module -e "import('./game/src/engine.mjs')..."`
// A game is a turn-based duel: the Challenger (30 life) vs the Ashen
// Regent (55 life). Embers are mana: +3 a turn, cap 6, unspent carries.
// The court rule: the second (and later) card of one suit played in a
// turn gets +2 to its main number.

import { freshDeck, mainNumber } from './cards.mjs';

// Small deterministic RNG (mulberry32) so demo states and sims repeat.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(deck, rng) {
  const d = deck.slice();
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

export const PLAYER_MAX_HP = 30;
export const RIVAL_MAX_HP = 45;
export const PLAYER_EMBERS_PER_TURN = 3;
export const RIVAL_EMBERS_PER_TURN = 3;
export const PLAYER_DRAW_PER_TURN = 2;
export const RIVAL_DRAW_PER_TURN = 2;
export const RIVAL_MAX_PLAYS = 2;
export const HAND_CAP = 7;
export const EMBER_CAP = 6;
export const RIVAL_EMBER_CAP = 8;
export const SHIELD_CAP = 12;
export const COURT_BONUS = 2;

export function newSide(hp, deck) {
  return {
    hp, maxHp: hp, shield: 0, embers: 0,
    deck: deck.slice(), hand: [], discard: [],
    burn: 0, thorn: 0, weaken: 0,
  };
}

export function newGame(seed = 7) {
  const rng = makeRng(seed);
  const game = {
    seed,
    rng,
    phase: 'title', // title | play | won | lost
    turn: 'player',
    turnCount: 0,
    player: newSide(PLAYER_MAX_HP, shuffle(freshDeck(), rng)),
    rival: newSide(RIVAL_MAX_HP, shuffle(freshDeck(), rng)),
    courtSuits: [], // suits played this turn, for the court bonus
    intent: null, // the rival's announced plan: { cards: [...], text }
    log: [],
    stats: { turns: 0, cardsPlayed: 0, damageDealt: 0, damageTaken: 0, healed: 0 },
    events: [], // floaters for the renderer: { kind, side, amount, text }
  };
  return game;
}

export function say(game, text) {
  game.log.push(text);
  if (game.log.length > 40) game.log.shift();
}

export function drawCards(game, side, n) {
  for (let i = 0; i < n; i++) {
    if (side.hand.length >= HAND_CAP) return;
    if (side.deck.length === 0) {
      if (side.discard.length === 0) return;
      side.deck = shuffle(side.discard, game.rng);
      side.discard = [];
    }
    side.hand.push(side.deck.pop());
  }
}

// Burn and thorn stacks tick at the start of the afflicted side's turn,
// then decay by one. Shield soaks damage before life does.
export function tickDots(game, side, who) {
  const total = side.burn + side.thorn;
  if (total > 0) {
    applyDamage(game, side, total, who, true);
    say(game, `${who} suffers ${total} from burn & thorns.`);
    if (side.burn > 0) side.burn -= 1;
    if (side.thorn > 0) side.thorn -= 1;
  }
}

export function applyDamage(game, side, amount, who, isDot = false) {
  let left = amount;
  if (side.shield > 0) {
    const soaked = Math.min(side.shield, left);
    side.shield -= soaked;
    left -= soaked;
  }
  side.hp = Math.max(0, side.hp - left);
  if (!isDot) {
    game.events.push({ kind: 'damage', side: who, amount: left, text: `−${left}` });
  }
  return left;
}

export function applyHeal(game, side, amount, who) {
  const healed = Math.min(amount, side.maxHp - side.hp);
  side.hp += healed;
  game.events.push({ kind: 'heal', side: who, amount: healed, text: `+${healed}` });
  return healed;
}

export function applyShield(game, side, amount, who) {
  const gained = Math.min(amount, SHIELD_CAP - side.shield);
  side.shield += gained;
  game.events.push({ kind: 'shield', side: who, amount: gained, text: `+${gained}🛡` });
  return gained;
}

// Is this card's suit already on the table this turn? Then +2.
export function courtBonus(game, card) {
  return game.courtSuits.includes(card.suit) ? COURT_BONUS : 0;
}

export function describePlay(game, card, bonus) {
  const badge = bonus > 0 ? ` (COURT +${bonus})` : '';
  return `${card.name}${badge}`;
}

// Play one card from a side's hand. Returns false when illegal.
export function playCard(game, side, foe, cardUid, who) {
  const idx = side.hand.findIndex((c) => c.uid === cardUid);
  if (idx < 0) return false;
  const card = side.hand[idx];
  if (card.cost > side.embers) return false;
  const bonus = courtBonus(game, card);
  const eff = { ...card.effect };
  // The court bonus raises the card's main number: damage, else heal, else shield.
  if (bonus > 0) {
    if (eff.dmg) eff.dmg += bonus;
    else if (eff.heal) eff.heal += bonus;
    else if (eff.shield) eff.shield += bonus;
  }
  // Snare weakens the attacker's next damage-dealing card.
  let dmg = eff.dmg || 0;
  if (dmg > 0 && side.weaken > 0) {
    dmg = Math.max(0, dmg - side.weaken);
    say(game, `${who}'s attack is snared −${side.weaken}.`);
    side.weaken = 0;
  }

  side.embers -= card.cost;
  side.hand.splice(idx, 1);
  side.discard.push(card);
  if (!game.courtSuits.includes(card.suit)) game.courtSuits.push(card.suit);
  game.stats.cardsPlayed += 1;

  if (dmg > 0) {
    const dealt = applyDamage(game, foe, dmg, who === 'player' ? 'rival' : 'player');
    if (who === 'player') game.stats.damageDealt += dealt;
    else game.stats.damageTaken += dealt;
  }
  if (eff.heal) {
    const healed = applyHeal(game, side, eff.heal, who);
    if (who === 'player') game.stats.healed += healed;
  }
  if (eff.shield) applyShield(game, side, eff.shield, who);
  if (eff.burn) { foe.burn += eff.burn; game.events.push({ kind: 'burn', side: who === 'player' ? 'rival' : 'player', amount: eff.burn, text: `Burn ${eff.burn}` }); }
  if (eff.thorn) { foe.thorn += eff.thorn; game.events.push({ kind: 'thorn', side: who === 'player' ? 'rival' : 'player', amount: eff.thorn, text: `Thorn ${eff.thorn}` }); }
  if (eff.weaken) { foe.weaken += eff.weaken; }
  if (eff.draw) drawCards(game, side, eff.draw);
  if (eff.ember) side.embers = Math.min(side.embers + eff.ember, who === 'player' ? EMBER_CAP : RIVAL_EMBER_CAP);

  say(game, `${who === 'player' ? 'You play' : 'The Regent plays'} ${describePlay(game, card, bonus)}.`);
  return true;
}

export function checkEnd(game) {
  if (game.rival.hp <= 0) { game.phase = 'won'; return 'won'; }
  if (game.player.hp <= 0) { game.phase = 'lost'; return 'lost'; }
  return null;
}

export function startGame(game) {
  game.phase = 'play';
  game.turn = 'player';
  game.turnCount = 1;
  game.stats.turns = 1;
  game.player.embers = 3;
  drawCards(game, game.player, 5);
  drawCards(game, game.rival, 5);
  game.rival.embers = 2;
  say(game, 'The Ashen Regent takes the far seat. Your move, Challenger.');
  say(game, 'Court rule: a second card of one suit in a turn gets +2.');
  return game;
}

export function startPlayerTurn(game) {
  game.turn = 'player';
  game.turnCount += 1;
  game.stats.turns = game.turnCount;
  game.courtSuits = [];
  tickDots(game, game.player, 'You');
  if (checkEnd(game)) return game;
  game.player.embers = Math.min(game.player.embers + PLAYER_EMBERS_PER_TURN, EMBER_CAP);
  drawCards(game, game.player, PLAYER_DRAW_PER_TURN);
  say(game, `— Turn ${game.turnCount}: your move. +${PLAYER_EMBERS_PER_TURN} embers, draw ${PLAYER_DRAW_PER_TURN}.`);
  return game;
}

// The rival answers the intent it announced, then draws and announces
// the next one. `plan` is the list of card uids chosen by rival.mjs.
export function runRivalTurn(game, plan) {
  game.turn = 'rival';
  game.courtSuits = [];
  tickDots(game, game.rival, 'The Regent');
  if (checkEnd(game)) return game;
  game.rival.embers = Math.min(game.rival.embers + RIVAL_EMBERS_PER_TURN, RIVAL_EMBER_CAP);
  let played = 0;
  for (const uid of plan) {
    if (played >= RIVAL_MAX_PLAYS) break;
    if (playCard(game, game.rival, game.player, uid, 'rival')) played += 1;
    if (checkEnd(game)) return game;
  }
  if (played === 0) say(game, 'The Regent holds its cards and watches you.');
  drawCards(game, game.rival, RIVAL_DRAW_PER_TURN);
  return game;
}

export function endPlayerTurn(game, currentPlanUids, nextIntent) {
  runRivalTurn(game, currentPlanUids);
  if (game.phase !== 'play') return game;
  game.intent = nextIntent;
  startPlayerTurn(game);
  return game;
}

// A plain snapshot for the renderer and for sims — no functions, no rng.
export function snapshot(game) {
  return {
    phase: game.phase,
    turn: game.turn,
    turnCount: game.turnCount,
    player: {
      hp: game.player.hp, maxHp: game.player.maxHp, shield: game.player.shield,
      embers: game.player.embers, hand: game.player.hand.map((c) => ({ ...c })),
      deck: game.player.deck.length, discard: game.player.discard.length,
      burn: game.player.burn, thorn: game.player.thorn, weaken: game.player.weaken,
    },
    rival: {
      hp: game.rival.hp, maxHp: game.rival.maxHp, shield: game.rival.shield,
      embers: game.rival.embers, handCount: game.rival.hand.length,
      deck: game.rival.deck.length, discard: game.rival.discard.length,
      burn: game.rival.burn, thorn: game.rival.thorn, weaken: game.rival.weaken,
    },
    courtSuits: game.courtSuits.slice(),
    intent: game.intent,
    log: game.log.slice(-8),
    stats: { ...game.stats },
    events: game.events.splice(0),
  };
}

// True when a card can be played right now.
export function playable(game, card) {
  return game.phase === 'play' && game.turn === 'player' && card.cost <= game.player.embers;
}
