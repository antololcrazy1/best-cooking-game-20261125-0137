// player.js — the chef: position, facing, what the hands hold, walking
// (keyboard or click-to-move) and bumping into counters.
import { CANVAS_HEIGHT, CANVAS_WIDTH, HUD_HEIGHT, PLAYER_RADIUS, PLAYER_SPEED, STATIONS } from './config.js';

export function makePlayer() {
  return {
    x: CANVAS_WIDTH / 2,
    y: 400,
    facing: 'down',
    hands: null, // null | {kind, state} | {dish}
    walkPhase: 0,
    moving: false,
    moveTarget: null, // {x, y, station} | null
  };
}

export function stationApproachPoint(station) {
  const s = STATIONS[station];
  // Stand just outside the station, centred on it. Stations hugging the
  // bottom wall are approached from above — there is no floor below them
  // to walk around on, and a straight walk would stall on the counter.
  const nearBottom = s.y + s.h > CANVAS_HEIGHT - 80;
  return {
    x: s.x + s.w / 2,
    y: nearBottom
      ? s.y - PLAYER_RADIUS - 8
      : Math.min(s.y + s.h + PLAYER_RADIUS + 8, CANVAS_HEIGHT - PLAYER_RADIUS - 8),
    station,
  };
}

function collideWithStations(player) {
  for (const key of Object.keys(STATIONS)) {
    const s = STATIONS[key];
    const nearestX = Math.max(s.x, Math.min(player.x, s.x + s.w));
    const nearestY = Math.max(s.y, Math.min(player.y, s.y + s.h));
    const dx = player.x - nearestX;
    const dy = player.y - nearestY;
    const dist = Math.hypot(dx, dy);
    if (dist < PLAYER_RADIUS && dist > 0) {
      player.x = nearestX + (dx / dist) * PLAYER_RADIUS;
      player.y = nearestY + (dy / dist) * PLAYER_RADIUS;
    } else if (dist === 0) {
      player.y = s.y + s.h + PLAYER_RADIUS;
    }
  }
}

export function updatePlayer(player, dt, moveVec, clickTarget) {
  player.moving = false;
  if (clickTarget) {
    player.moveTarget = clickTarget;
  }
  if (moveVec.dx !== 0 || moveVec.dy !== 0) {
    player.moveTarget = null;
    player.x += moveVec.dx * PLAYER_SPEED * dt;
    player.y += moveVec.dy * PLAYER_SPEED * dt;
    player.moving = true;
    if (Math.abs(moveVec.dx) > Math.abs(moveVec.dy)) {
      player.facing = moveVec.dx > 0 ? 'right' : 'left';
    } else {
      player.facing = moveVec.dy > 0 ? 'down' : 'up';
    }
  } else if (player.moveTarget) {
    const dx = player.moveTarget.x - player.x;
    const dy = player.moveTarget.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 8) {
      player.moveTarget = null;
    } else {
      const step = Math.min(dist, PLAYER_SPEED * dt);
      player.x += (dx / dist) * step;
      player.y += (dy / dist) * step;
      player.moving = true;
      if (Math.abs(dx) > Math.abs(dy)) {
        player.facing = dx > 0 ? 'right' : 'left';
      } else {
        player.facing = dy > 0 ? 'down' : 'up';
      }
    }
  }
  if (player.moving) player.walkPhase += dt * 11;

  player.x = Math.max(PLAYER_RADIUS + 8, Math.min(CANVAS_WIDTH - PLAYER_RADIUS - 8, player.x));
  player.y = Math.max(HUD_HEIGHT + PLAYER_RADIUS + 4, Math.min(CANVAS_HEIGHT - PLAYER_RADIUS - 8, player.y));
  collideWithStations(player);
  return player.moveTarget;
}

export function nearestStation(player) {
  let best = null;
  let bestDist = Infinity;
  for (const key of Object.keys(STATIONS)) {
    const s = STATIONS[key];
    const cx = Math.max(s.x, Math.min(player.x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(player.y, s.y + s.h));
    const dist = Math.hypot(player.x - cx, player.y - cy);
    if (dist < bestDist) {
      bestDist = dist;
      best = key;
    }
  }
  return bestDist <= 78 ? best : null;
}

export function stationAtPoint(x, y) {
  for (const key of Object.keys(STATIONS)) {
    const s = STATIONS[key];
    if (x >= s.x - 6 && x <= s.x + s.w + 6 && y >= s.y - 6 && y <= s.y + s.h + 6) {
      return key;
    }
  }
  return null;
}

export function heldLabel(hands) {
  if (!hands) return '';
  if (hands.dish) return hands.dish.name;
  const state = hands.state === 'raw' ? '' : ` ${hands.state}`;
  return `${hands.kind}${state}`;
}
