// orders.js — the order board: tickets arrive, count down, get served for
// money and tips, or expire and cost the kitchen a heart.
import {
  COMBO_WINDOW_MS, MAX_ORDERS, ORDER_PATIENCE_END, ORDER_PATIENCE_START, RECIPES, RECIPE_ORDER,
  SPAWN_GAP_END_MS, SPAWN_GAP_START_MS, TIP_MAX,
} from './config.js';
import { sfx } from './audio.js';

export function makeOrdersState() {
  return {
    list: [], // {id, recipeId, patienceMs, patienceMaxMs, bornAt}
    nextId: 1,
    spawnInMs: 1500,
    served: 0,
    missed: 0,
    earned: 0,
    combo: 0,
    lastServeAt: 0,
  };
}

function patienceFor(progress) {
  const seconds = ORDER_PATIENCE_START + (ORDER_PATIENCE_END - ORDER_PATIENCE_START) * progress;
  return seconds * 1000;
}

function spawnGapFor(progress) {
  return SPAWN_GAP_START_MS + (SPAWN_GAP_END_MS - SPAWN_GAP_START_MS) * progress;
}

export function pickRecipeId(random) {
  return RECIPE_ORDER[Math.floor(random() * RECIPE_ORDER.length)];
}

export function updateOrders(orders, dtMs, nowMs, shiftProgress, random) {
  const expired = [];
  for (const order of orders.list) {
    order.patienceMs -= dtMs;
    if (order.patienceMs <= 0) expired.push(order);
  }
  for (const order of expired) {
    orders.list.splice(orders.list.indexOf(order), 1);
    orders.missed += 1;
    orders.combo = 0;
    sfx.orderLost();
  }

  orders.spawnInMs -= dtMs;
  if (orders.spawnInMs <= 0 && orders.list.length < MAX_ORDERS) {
    const recipeId = pickRecipeId(random);
    orders.list.push({
      id: orders.nextId,
      recipeId,
      patienceMs: patienceFor(shiftProgress),
      patienceMaxMs: patienceFor(shiftProgress),
      bornAt: nowMs,
    });
    orders.nextId += 1;
    orders.spawnInMs = spawnGapFor(shiftProgress);
    sfx.orderIn();
  }
  return expired.length;
}

// Serve a finished dish. Returns the money earned, or 0 when no open
// ticket wants that dish.
export function serveDish(orders, recipeId, nowMs) {
  const idx = orders.list.findIndex((order) => order.recipeId === recipeId);
  if (idx === -1) return 0;
  const order = orders.list[idx];
  orders.list.splice(idx, 1);
  const freshness = Math.max(0, order.patienceMs / order.patienceMaxMs);
  if (nowMs - orders.lastServeAt <= COMBO_WINDOW_MS && orders.combo > 0) {
    orders.combo += 1;
  } else {
    orders.combo = 1;
  }
  orders.lastServeAt = nowMs;
  const tip = Math.round(TIP_MAX * freshness) + Math.min(orders.combo - 1, 3);
  const earned = RECIPES[recipeId].price + tip;
  orders.earned += earned;
  orders.served += 1;
  return earned;
}

export function oldestOrderAgeMs(orders) {
  if (orders.list.length === 0) return 0;
  return Math.min(...orders.list.map((o) => o.patienceMs));
}
