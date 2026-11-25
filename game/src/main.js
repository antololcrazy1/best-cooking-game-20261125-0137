// main.js — boot and the game loop. Owns the canvas, the clock and the
// screen state; the kitchen owns the rules, the renderer owns the pixels.
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './config.js';
import { bindInput, moveVector, takeClickQueued, takeClickTarget, takeInteractQueued } from './input.js';
import { handleClick, handleKey, makeGame, startShift, updateGame } from './kitchen.js';
import { nearestStation } from './player.js';
import { renderGame } from './render.js';
import { ensureAudio, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = canvas.getContext('2d');

const game = makeGame();
let lastTime = performance.now();

bindInput(canvas, {
  onKey(key) {
    if (key === 'm') {
      toggleMute();
      return;
    }
    if (key === 'p' && game.screen === 'paused') {
      game.screen = 'playing';
      return;
    }
    ensureAudio();
    handleKey(game, key);
  },
  onClick(x, y) {
    ensureAudio();
    if (game.screen === 'title' || game.screen === 'over') {
      startShift(game, game.nowMs);
      return;
    }
    if (game.screen === 'paused') {
      game.screen = 'playing';
      return;
    }
    handleClick(game, x, y);
  },
});

function frame(now) {
  const dtMs = Math.min(100, now - lastTime);
  lastTime = now;
  if (game.screen === 'playing') {
    // Clicks are already handled by handleClick via the click handler;
    // only drain the stored target so it never re-aims the chef.
    takeClickTarget();
    updateGame(game, dtMs, moveVector(), null, takeInteractQueued());
  } else {
    // Keep the clock running so the title screen pulses and the
    // paused/over screens stay still; drain queued input.
    game.nowMs += dtMs;
    takeClickTarget();
    takeInteractQueued();
    takeClickQueued();
  }
  renderGame(ctx, game, game.screen === 'playing' ? nearestStation(game.player) : null);
  requestAnimationFrame(frame);
}

// A small hook for automated playtests: the current state, read-only.
window.__sizzle = {
  game,
  start: () => startShift(game, game.nowMs),
  state: () => ({
    screen: game.screen,
    money: game.orders.earned,
    served: game.orders.served,
    missed: game.orders.missed,
    hearts: game.hearts,
    clockMsLeft: game.shiftMsLeft,
    orders: game.orders.list.map((o) => o.recipeId),
    hands: game.player.hands,
    plate: [...game.stations.plate],
  }),
};

requestAnimationFrame(frame);
