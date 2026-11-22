// Ember Court — the card catalogue.
// Four suits, told apart by colour AND shape, never by text alone:
//   Ember ▲ (damage)  Tide ● (heal / shield)  Thorn ◆ (lingering hurt)  Gale ★ (draw / embers)
// Every card is data: name, suit, cost in embers, and one effect object.
// The court rule lives in engine.mjs: the second (and later) card of one
// suit played in a turn gets +2 to its main number.

export const SUITS = {
  ember: { name: 'Ember', glyph: '▲', color: '#d9480f', soft: '#ffe8cc' },
  tide: { name: 'Tide', glyph: '●', color: '#1971c2', soft: '#d0ebff' },
  thorn: { name: 'Thorn', glyph: '◆', color: '#2b8a3e', soft: '#d3f9d8' },
  gale: { name: 'Gale', glyph: '★', color: '#7048e8', soft: '#e5dbff' },
};

export const SUIT_ORDER = ['ember', 'tide', 'thorn', 'gale'];

// effect keys: dmg (damage to the foe), heal (restore own life), shield
// (block that soaks damage first), draw (cards), ember (embers gained),
// burn (damage-over-time stacks on the foe), thorn (lingering stacks on
// the foe), weaken (the foe's next attack loses this much damage).
export const CARDS = [
  { id: 'strike', name: 'Strike', suit: 'ember', cost: 1, effect: { dmg: 4 }, text: 'Deal 4 damage.' },
  { id: 'strike', name: 'Strike', suit: 'ember', cost: 1, effect: { dmg: 4 }, text: 'Deal 4 damage.' },
  { id: 'blaze', name: 'Blaze', suit: 'ember', cost: 3, effect: { dmg: 8 }, text: 'Deal 8 damage.' },
  { id: 'cinder', name: 'Cinder Slash', suit: 'ember', cost: 2, effect: { dmg: 5 }, text: 'Deal 5 damage.' },
  { id: 'spark', name: 'Spark', suit: 'ember', cost: 0, effect: { dmg: 2 }, text: 'Deal 2 damage.' },
  { id: 'inferno', name: 'Inferno', suit: 'ember', cost: 3, effect: { dmg: 7, burn: 2 }, text: 'Deal 7 damage. Burn 2.' },

  { id: 'mend', name: 'Mend', suit: 'tide', cost: 2, effect: { heal: 5 }, text: 'Restore 5 life.' },
  { id: 'mend', name: 'Mend', suit: 'tide', cost: 2, effect: { heal: 5 }, text: 'Restore 5 life.' },
  { id: 'bulwark', name: 'Bulwark', suit: 'tide', cost: 1, effect: { shield: 5 }, text: 'Gain 5 shield.' },
  { id: 'bulwark', name: 'Bulwark', suit: 'tide', cost: 1, effect: { shield: 5 }, text: 'Gain 5 shield.' },
  { id: 'surge', name: 'Surge', suit: 'tide', cost: 2, effect: { heal: 2, draw: 1 }, text: 'Restore 2 life. Draw 1.' },
  { id: 'tidalwall', name: 'Tidal Wall', suit: 'tide', cost: 2, effect: { shield: 8 }, text: 'Gain 8 shield.' },

  { id: 'thorns', name: 'Thorns', suit: 'thorn', cost: 2, effect: { dmg: 3, thorn: 3 }, text: 'Deal 3 damage. Thorn 3.' },
  { id: 'thorns', name: 'Thorns', suit: 'thorn', cost: 2, effect: { dmg: 3, thorn: 3 }, text: 'Deal 3 damage. Thorn 3.' },
  { id: 'snare', name: 'Snare', suit: 'thorn', cost: 2, effect: { dmg: 2, weaken: 3 }, text: 'Deal 2 damage. Foe attacks −3 next.' },
  { id: 'briar', name: 'Briar', suit: 'thorn', cost: 3, effect: { dmg: 6 }, text: 'Deal 6 damage.' },
  { id: 'briar', name: 'Briar', suit: 'thorn', cost: 3, effect: { dmg: 6 }, text: 'Deal 6 damage.' },
  { id: 'leech', name: 'Leech Vine', suit: 'thorn', cost: 2, effect: { dmg: 3, heal: 2 }, text: 'Deal 3 damage. Restore 2 life.' },

  { id: 'gust', name: 'Gust', suit: 'gale', cost: 1, effect: { draw: 2 }, text: 'Draw 2 cards.' },
  { id: 'gust', name: 'Gust', suit: 'gale', cost: 1, effect: { draw: 2 }, text: 'Draw 2 cards.' },
  { id: 'zephyr', name: 'Zephyr', suit: 'gale', cost: 0, effect: { ember: 2 }, text: 'Gain 2 embers.' },
  { id: 'zephyr', name: 'Zephyr', suit: 'gale', cost: 0, effect: { ember: 2 }, text: 'Gain 2 embers.' },
  { id: 'tempest', name: 'Tempest', suit: 'gale', cost: 3, effect: { dmg: 5, draw: 1 }, text: 'Deal 5 damage. Draw 1.' },
  { id: 'tailwind', name: 'Tailwind', suit: 'gale', cost: 1, effect: { draw: 1, ember: 1 }, text: 'Draw 1 card. Gain 1 ember.' },
];

// A fresh copy of the 24-card deck, each card stamped with a unique uid.
export function freshDeck() {
  return CARDS.map((c, i) => ({ ...c, effect: { ...c.effect }, uid: `c${i}` }));
}

// The card's main number: the one the court bonus (+2) raises.
// Damage first, then heal, then shield — the number the card is about.
export function mainNumber(card) {
  if (card.effect.dmg) return card.effect.dmg;
  if (card.effect.heal) return card.effect.heal;
  if (card.effect.shield) return card.effect.shield;
  return 0;
}

// A one-line summary of a card for the rival's intent badge and the log.
export function shortText(card) {
  const parts = [];
  if (card.effect.dmg) parts.push(`${card.effect.dmg}`);
  if (card.effect.heal) parts.push(`+${card.effect.heal}♥`);
  if (card.effect.shield) parts.push(`+${card.effect.shield}🛡`);
  if (card.effect.draw) parts.push(`draw ${card.effect.draw}`);
  if (card.effect.ember) parts.push(`+${card.effect.ember} ember`);
  return `${card.name} ${parts.join(' ')}`.trim();
}
