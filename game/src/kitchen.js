// kitchen.js — the game itself: one state object, the update step, and the
// rules that turn a key press or a click into cooking.
import {
  CANVAS_HEIGHT, CANVAS_WIDTH, INGREDIENTS, INGREDIENT_ORDER, MAX_HEARTS,
  SHIFT_SECONDS, STATIONS,
} from './config.js';
import { makePlayer, nearestStation, stationApproachPoint, stationAtPoint, updatePlayer } from './player.js';
import { fridgeIngredientAt, makeStationsState, updateGrill, useStation } from './stations.js';
import { makeOrdersState, updateOrders } from './orders.js';
import { ensureAudio, sfx } from './audio.js';

export function makeGame() {
  return {
    screen: 'title', // 'title' | 'playing' | 'paused' | 'over'
    player: makePlayer(),
    stations: makeStationsState(),
    orders: makeOrdersState(),
    shiftMsLeft: SHIFT_SECONDS * 1000,
    shiftElapsedMs: 0,
    hearts: MAX_HEARTS,
    floaters: [], // {x, y, text, color, bornMs, lifeMs}
    pendingInteractStation: null,
    startedAt: 0,
    nowMs: 0,
    seed: 1234567,
  };
}

export function startShift(game, nowMs) {
  game.screen = 'playing';
  game.player = makePlayer();
  game.stations = makeStationsState();
  game.orders = makeOrdersState();
  game.shiftMsLeft = SHIFT_SECONDS * 1000;
  game.shiftElapsedMs = 0;
  game.hearts = MAX_HEARTS;
  game.floaters = [];
  game.pendingInteractStation = null;
  game.startedAt = nowMs;
  game.nowMs = nowMs;
  ensureAudio();
}

function randomFromSeed(game) {
  // A tiny deterministic generator, so a playthrough can be replayed.
  game.seed = (game.seed * 1103515245 + 12345) % 2147483648;
  return game.seed / 2147483648;
}

export function addFloater(game, x, y, text, color) {
  game.floaters.push({ x, y, text, color: color || '#fff6e3', bornMs: game.nowMs, lifeMs: 1400 });
}

const EVENT_TEXT = {
  'picked': ['Picked up!', '#fff6e3'],
  'hands-full': ['Hands full!', '#f5a623'],
  'placed-board': ['On the board — chop it!', '#fff6e3'],
  'chopping': ['Chop chop…', '#fff6e3'],
  'chopped': ['Chopped!', '#58b368'],
  'took-chopped': ['Chopped tomato in hand!', '#fff6e3'],
  'nothing-to-chop': ['Need tomato or lettuce', '#f5a623'],
  'already-prepped': ['Already prepped', '#f5a623'],
  'cant-chop': ['This does not chop', '#f5a623'],
  'grilling': ['On the grill!', '#fff6e3'],
  'grill-full': ['Grill is full!', '#f5a623'],
  'grill-empty': ['Nothing cooking', '#f5a623'],
  'took-grill': ['Hot off the grill!', '#fff6e3'],
  'plated': ['On the plate!', '#fff6e3'],
  'dish-ready': ['Dish ready — serve it!', '#58b368'],
  'took-dish': ['Dish in hand!', '#fff6e3'],
  'took-back': ['Taken back', '#fff6e3'],
  'not-ready': ['Not ready for the plate', '#f5a623'],
  'not-in-recipe': ['No recipe wants that', '#f5a623'],
  'plate-empty': ['Plate is empty', '#f5a623'],
  'dish-in-hands': ['Serve the dish first!', '#f5a623'],
  'nothing-to-serve': ['Need a finished dish', '#f5a623'],
  'no-order': ['No ticket wants this!', '#e23b2e'],
  'binned': ['Binned', '#fff6e3'],
  'hands-empty': ['Hands are empty', '#f5a623'],
  'cant-bin-dish': ['Serve it, do not bin it!', '#f5a623'],
};

export function interactWithStation(game, station) {
  const event = useStation(game.stations, station, game.player, game.orders, game.nowMs);
  if (event.startsWith('served:')) {
    const earned = Number(event.split(':')[1]);
    addFloater(game, game.player.x, game.player.y - 44, `+$${earned} served!`, '#58b368');
    return event;
  }
  const [text, color] = EVENT_TEXT[event] || [event, '#fff6e3'];
  addFloater(game, game.player.x, game.player.y - 44, text, color);
  return event;
}

export function handleClick(game, x, y) {
  if (game.screen !== 'playing') return;
  const station = stationAtPoint(x, y);
  if (station === 'fridge') {
    const kind = fridgeIngredientAt(x, y);
    if (kind) {
      game.stations.fridgeSelected = kind;
      if (nearestStation(game.player) === 'fridge') {
        if (!game.player.hands) interactWithStation(game, 'fridge');
        return;
      }
      game.player.moveTarget = stationApproachPoint('fridge');
      game.pendingInteractStation = 'fridge';
      return;
    }
  }
  if (station) {
    game.player.moveTarget = stationApproachPoint(station);
    game.pendingInteractStation = station;
  } else {
    game.player.moveTarget = { x, y, station: null };
    game.pendingInteractStation = null;
  }
}

export function handleKey(game, key) {
  if (game.screen === 'title' && (key === 'enter' || key === ' ')) {
    startShift(game, game.nowMs);
    return;
  }
  if (game.screen === 'over' && (key === 'r' || key === 'enter' || key === ' ')) {
    startShift(game, game.nowMs);
    return;
  }
  if (game.screen !== 'playing') return;
  if (key === 'p') {
    game.screen = 'paused';
    return;
  }
  if (key === 'm') {
    return; // mute is handled by main.js (it owns the audio module)
  }
  const near = nearestStation(game.player);
  if (near === 'fridge') {
    const kind = INGREDIENT_ORDER.find((k) => INGREDIENTS[k].key === key);
    if (kind) {
      game.stations.fridgeSelected = kind;
      interactWithStation(game, 'fridge');
      return;
    }
  }
}

export function updateGame(game, dtMs, moveVec, clickTarget, interactPressed) {
  if (game.screen !== 'playing') return;
  game.nowMs += dtMs;
  game.shiftElapsedMs += dtMs;
  game.shiftMsLeft = Math.max(0, SHIFT_SECONDS * 1000 - game.shiftElapsedMs);

  // Steering with the keys cancels a walk-to-station order.
  if (moveVec.dx !== 0 || moveVec.dy !== 0) game.pendingInteractStation = null;

  updatePlayer(game.player, dtMs / 1000, moveVec, clickTarget);

  // Arrived at a station we were walking to: use it.
  if (game.pendingInteractStation && !game.player.moveTarget) {
    const station = game.pendingInteractStation;
    game.pendingInteractStation = null;
    interactWithStation(game, station);
  }

  if (interactPressed) {
    const near = nearestStation(game.player);
    if (near) interactWithStation(game, near);
  }

  updateGrill(game.stations, dtMs);
  const progress = Math.min(1, game.shiftElapsedMs / (SHIFT_SECONDS * 1000));
  const expired = updateOrders(game.orders, dtMs, game.nowMs, progress, () => randomFromSeed(game));
  if (expired > 0) {
    game.hearts -= expired;
    addFloater(game, CANVAS_WIDTH / 2, 160, `Order expired! -1 heart`, '#e23b2e');
    if (game.hearts <= 0) {
      endShift(game);
      return;
    }
  }

  // Last-ten-seconds tick.
  if (game.shiftMsLeft <= 10000 && game.shiftMsLeft > 0) {
    const sec = Math.ceil(game.shiftMsLeft / 1000);
    if (sec !== game.lastTickSecond) {
      game.lastTickSecond = sec;
      sfx.tick();
    }
  }

  game.floaters = game.floaters.filter((f) => game.nowMs - f.bornMs < f.lifeMs);

  if (game.shiftMsLeft <= 0) {
    endShift(game);
  }
}

export function endShift(game) {
  game.screen = 'over';
  game.hearts = Math.max(0, game.hearts);
  sfx.gameOver();
}

export function shiftClockText(game) {
  const totalSec = Math.ceil(game.shiftMsLeft / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

export function shiftProgress(game) {
  return Math.min(1, game.shiftElapsedMs / (SHIFT_SECONDS * 1000));
}
