// stations.js — what each kitchen station holds and what happens when the
// chef uses it: fridge gives ingredients, board chops, grill cooks, the
// plating counter assembles dishes, the window serves, the bin discards.
import {
  CHOP_HITS, GRILL_BURN_MS, GRILL_COOK_MS, INGREDIENTS, RECIPES,
} from './config.js';
import { serveDish } from './orders.js';
import { sfx } from './audio.js';

export function makeStationsState() {
  return {
    fridgeSelected: 'bread',
    board: { item: null, hits: 0 }, // item: {kind, state}
    grill: [null, null], // each slot: null | {kind, state, cookedMs}
    plate: [], // prepared ingredient labels on the plating counter
  };
}

export function preparedLabel(item) {
  if (item.state === 'raw') return item.kind;
  return `${item.state} ${item.kind}`;
}

export function recipeForPlate(plateItems) {
  const sorted = [...plateItems].sort();
  for (const id of Object.keys(RECIPES)) {
    const needs = [...RECIPES[id].needs].sort();
    if (sorted.length === needs.length && sorted.every((v, i) => v === needs[i])) {
      return id;
    }
  }
  return null;
}

export function plateCouldBecomeRecipe(plateItems, extraLabel) {
  const candidate = [...plateItems, extraLabel].sort();
  return Object.values(RECIPES).some((recipe) => {
    const needs = [...recipe.needs].sort();
    if (candidate.length > needs.length) return false;
    const pool = [...needs];
    return candidate.every((label) => {
      const idx = pool.indexOf(label);
      if (idx === -1) return false;
      pool.splice(idx, 1);
      return true;
    });
  });
}

export function updateGrill(stations, dtMs) {
  for (const slot of stations.grill) {
    if (!slot) continue;
    slot.cookedMs += dtMs;
    if (slot.state === 'raw' && slot.cookedMs >= GRILL_COOK_MS) {
      slot.state = 'cooked';
      sfx.cookedReady();
    } else if (slot.state === 'cooked' && slot.cookedMs >= GRILL_BURN_MS) {
      slot.state = 'burnt';
    }
  }
}

// The chef uses a station. Returns a short event string the kitchen uses
// for floating feedback ('picked', 'chopped', 'served', 'rejected', ...).
export function useStation(stations, station, player, orders, nowMs) {
  const hands = player.hands;

  if (station === 'fridge') {
    if (hands) return 'hands-full';
    const kind = stations.fridgeSelected;
    player.hands = { kind, state: 'raw' };
    sfx.pickup();
    return 'picked';
  }

  if (station === 'board') {
    const board = stations.board;
    if (!board.item) {
      if (!hands || hands.dish) return 'nothing-to-chop';
      if (hands.state !== 'raw') return 'already-prepped';
      if (INGREDIENTS[hands.kind].prep !== 'chopped') return 'cant-chop';
      board.item = hands;
      board.hits = 0;
      player.hands = null;
      sfx.place();
      return 'placed-board';
    }
    if (board.item.state === 'chopped') {
      if (hands) return 'hands-full';
      player.hands = board.item;
      board.item = null;
      board.hits = 0;
      sfx.pickup();
      return 'took-chopped';
    }
    board.hits += 1;
    sfx.chop();
    if (board.hits >= CHOP_HITS) {
      board.item.state = 'chopped';
      sfx.choppedDone();
      return 'chopped';
    }
    return 'chopping';
  }

  if (station === 'grill') {
    const slots = stations.grill;
    if (hands && !hands.dish && hands.kind === 'patty' && hands.state === 'raw') {
      const free = slots.findIndex((slot) => slot === null);
      if (free === -1) return 'grill-full';
      slots[free] = { kind: 'patty', state: 'raw', cookedMs: 0 };
      player.hands = null;
      sfx.sizzleStart();
      return 'grilling';
    }
    if (!hands) {
      const ready = slots.findIndex((slot) => slot && slot.state !== 'raw');
      if (ready === -1) return 'grill-empty';
      player.hands = { kind: slots[ready].kind, state: slots[ready].state };
      slots[ready] = null;
      sfx.pickup();
      return 'took-grill';
    }
    return 'hands-full';
  }

  if (station === 'plate') {
    if (hands && hands.dish) {
      // A finished dish waits on the counter until the chef takes it back.
      return 'dish-in-hands';
    }
    if (hands) {
      const label = preparedLabel(hands);
      if (hands.state === 'burnt') return 'not-ready';
      if (hands.state === 'raw' && INGREDIENTS[hands.kind].prep !== 'none') return 'not-ready';
      if (!plateCouldBecomeRecipe(stations.plate, label)) return 'not-in-recipe';
      stations.plate.push(label);
      player.hands = null;
      sfx.plated();
      if (recipeForPlate(stations.plate)) {
        sfx.dishReady();
        return 'dish-ready';
      }
      return 'plated';
    }
    // Empty hands: pick up a finished dish, or take the last ingredient back.
    const recipeId = recipeForPlate(stations.plate);
    if (recipeId) {
      player.hands = { dish: { id: recipeId, name: RECIPES[recipeId].name } };
      stations.plate = [];
      sfx.pickup();
      return 'took-dish';
    }
    if (stations.plate.length > 0) {
      const label = stations.plate.pop();
      player.hands = labelToItem(label);
      sfx.pickup();
      return 'took-back';
    }
    return 'plate-empty';
  }

  if (station === 'window') {
    if (!hands || !hands.dish) return 'nothing-to-serve';
    const earned = serveDish(orders, hands.dish.id, nowMs);
    if (earned > 0) {
      player.hands = null;
      sfx.serve();
      return `served:${earned}`;
    }
    sfx.reject();
    return 'no-order';
  }

  if (station === 'trash') {
    if (!hands) return 'hands-empty';
    if (hands.dish) {
      // A finished dish is too good to bin; take it back to the plate.
      return 'cant-bin-dish';
    }
    player.hands = null;
    sfx.place();
    return 'binned';
  }
  return 'unknown-station';
}

export function labelToItem(label) {
  const parts = label.split(' ');
  if (parts.length === 1) return { kind: parts[0], state: 'raw' };
  return { kind: parts[1], state: parts[0] };
}

// Clicking the fridge picks a specific ingredient straight off its shelf.
export function fridgeIngredientAt(x, y) {
  // Fridge shelf icons are laid out by render.js in the same order.
  const kinds = ['bread', 'patty', 'tomato', 'lettuce', 'cheese'];
  const startX = 56;
  const startY = 168;
  for (let i = 0; i < kinds.length; i++) {
    const cx = startX + i * 29;
    if (x >= cx - 14 && x <= cx + 14 && y >= startY - 14 && y <= startY + 14) {
      return kinds[i];
    }
  }
  return null;
}
