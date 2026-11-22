// Ember Court — mouse + keyboard. Click a card to play it, click End
// Turn (or E / Space) to pass, keys 1–7 play hand cards, Enter starts
// or restarts, R restarts from the end screen.

export function bindInput(handlers) {
  document.getElementById('hand').addEventListener('click', (ev) => {
    const card = ev.target.closest('.card');
    if (!card) return;
    handlers.onPlayCard(card.dataset.uid);
  });
  document.getElementById('end-turn').addEventListener('click', () => {
    handlers.onEndTurn();
  });
  document.getElementById('play-btn').addEventListener('click', () => {
    handlers.onStart();
  });
  document.getElementById('again-btn').addEventListener('click', () => {
    handlers.onStart();
  });
  document.getElementById('howto-btn').addEventListener('click', () => {
    const box = document.getElementById('howto-text');
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.repeat) return;
    const key = ev.key.toLowerCase();
    if (key === 'enter') { handlers.onStart(); return; }
    if (key === 'r') { handlers.onStart(); return; }
    if (key === 'e' || key === ' ') { ev.preventDefault(); handlers.onEndTurn(); return; }
    const n = parseInt(key, 10);
    if (n >= 1 && n <= 7) handlers.onPlayIndex(n - 1);
  });
}
