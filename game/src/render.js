// render.js — every pixel of Sizzle & Serve is drawn here with canvas
// shapes: the kitchen, the stations, the chef, the order tickets and the
// screens. No image files are loaded.
import {
  CANVAS_HEIGHT, CANVAS_WIDTH, COLORS, HUD_HEIGHT, INGREDIENTS, INGREDIENT_ORDER,
  RECIPES, STATIONS,
} from './config.js';
import { preparedLabel, recipeForPlate } from './stations.js';
import { heldLabel } from './player.js';
import { shiftClockText, shiftProgress } from './kitchen.js';
import { isMuted } from './audio.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 'bold'} ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// --- ingredient icons -------------------------------------------------------
export function drawIngredientIcon(ctx, kind, x, y, r, state) {
  const ing = INGREDIENTS[kind];
  ctx.save();
  ctx.translate(x, y);
  if (state === 'burnt') {
    ctx.fillStyle = '#22201e';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.3);
    ctx.lineTo(r * 0.4, r * 0.4);
    ctx.moveTo(r * 0.5, -r * 0.4);
    ctx.lineTo(-r * 0.3, r * 0.5);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (kind === 'bread') {
    ctx.fillStyle = '#d99a3d';
    roundRect(ctx, -r, -r * 0.7, r * 2, r * 1.4, r * 0.6);
    ctx.fill();
    ctx.fillStyle = '#f2cd8d';
    roundRect(ctx, -r * 0.8, -r * 0.85, r * 1.6, r * 0.7, r * 0.3);
    ctx.fill();
  } else if (kind === 'patty') {
    ctx.fillStyle = state === 'cooked' ? '#6b3d1e' : '#9a6a42';
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
    if (state === 'cooked') {
      ctx.strokeStyle = '#3d2210';
      ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * r * 0.5 - r * 0.3, -r * 0.5);
        ctx.lineTo(i * r * 0.5 + r * 0.3, r * 0.5);
        ctx.stroke();
      }
    }
  } else if (kind === 'tomato') {
    if (state === 'chopped') {
      ctx.fillStyle = '#e23b2e';
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3);
        ctx.arc(0, 0, r * 0.85, a - 0.7, a + 0.7);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#ff8a7a';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#e23b2e';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#58b368';
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.85, r * 0.45, r * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'lettuce') {
    if (state === 'chopped') {
      ctx.fillStyle = '#58b368';
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.rotate((i / 4) * Math.PI * 2);
        ctx.beginPath();
        ctx.ellipse(r * 0.45, 0, r * 0.5, r * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else {
      ctx.fillStyle = '#58b368';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3d8a4c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.6, 0.3, Math.PI * 1.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.35, 2.2, Math.PI * 1.1);
      ctx.stroke();
    }
  } else if (kind === 'cheese') {
    ctx.fillStyle = '#f5c542';
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.6);
    ctx.lineTo(r, r * 0.6);
    ctx.lineTo(r, -r * 0.2);
    ctx.lineTo(0, -r * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d99a1e';
    ctx.beginPath();
    ctx.arc(-r * 0.3, r * 0.1, r * 0.16, 0, Math.PI * 2);
    ctx.arc(r * 0.35, r * 0.25, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlateIcon(ctx, x, y, r) {
  ctx.fillStyle = '#f4f6f8';
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c8d0d8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.7, r * 0.3, 0, 0, Math.PI * 2);
  ctx.stroke();
}

// --- kitchen ----------------------------------------------------------------
function drawFloor(ctx) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);
  for (let ty = 0; ty < 8; ty++) {
    for (let tx = 0; tx < 16; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(tx * 80, HUD_HEIGHT + ty * 80, 80, 80);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(0, HUD_HEIGHT, CANVAS_WIDTH, 6);
}

function drawStationBase(ctx, station, label, highlight) {
  const s = STATIONS[station];
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  roundRect(ctx, s.x + 3, s.y + 5, s.w, s.h, 12);
  ctx.fill();
  ctx.fillStyle = COLORS.counterTop;
  roundRect(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fill();
  ctx.strokeStyle = COLORS.counterWood;
  ctx.lineWidth = 3;
  roundRect(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.stroke();
  if (highlight) {
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 4;
    roundRect(ctx, s.x - 4, s.y - 4, s.w + 8, s.h + 8, 14);
    ctx.stroke();
  }
  text(ctx, label, s.x + s.w / 2, s.y + 13, 12, '#5b3a1e');
}

function drawFridge(ctx, game, highlight) {
  drawStationBase(ctx, 'fridge', 'FRIDGE — grab (1-5)', highlight);
  const s = STATIONS.fridge;
  ctx.fillStyle = '#dfe6ec';
  roundRect(ctx, s.x + 10, s.y + 26, s.w - 20, 44, 8);
  ctx.fill();
  ctx.strokeStyle = COLORS.steelDark;
  ctx.lineWidth = 2;
  roundRect(ctx, s.x + 10, s.y + 26, s.w - 20, 44, 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(s.x + s.w / 2, s.y + 26);
  ctx.lineTo(s.x + s.w / 2, s.y + 70);
  ctx.stroke();
  // Shelf icons — positions must match fridgeIngredientAt in stations.js.
  INGREDIENT_ORDER.forEach((kind, i) => {
    const cx = 56 + i * 29;
    const cy = 168;
    if (game.stations.fridgeSelected === kind) {
      ctx.fillStyle = 'rgba(245,197,66,0.45)';
      ctx.beginPath();
      ctx.arc(cx, cy, 17, 0, Math.PI * 2);
      ctx.fill();
    }
    drawIngredientIcon(ctx, kind, cx, cy, 12, 'raw');
  });
  ctx.fillStyle = '#5b3a1e';
  ctx.font = 'bold 10px Trebuchet MS, Verdana, sans-serif';
  ctx.textAlign = 'center';
  INGREDIENT_ORDER.forEach((kind, i) => {
    ctx.fillText(INGREDIENTS[kind].key, 56 + i * 29, 196);
  });
  text(ctx, 'click an ingredient, or press 1-5', s.x + s.w / 2, s.y + s.h - 10, 10, '#5b3a1e');
}

function drawBoard(ctx, game, highlight, nowMs) {
  drawStationBase(ctx, 'board', 'CHOPPING BOARD', highlight);
  const s = STATIONS.board;
  ctx.fillStyle = '#e8d9b0';
  roundRect(ctx, s.x + 24, s.y + 30, s.w - 48, s.h - 44, 8);
  ctx.fill();
  const board = game.stations.board;
  if (board.item) {
    drawIngredientIcon(ctx, board.item.kind, s.x + s.w / 2 - 18, s.y + s.h / 2 + 12, 16, board.item.state);
    // Chop progress pips.
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < board.hits ? COLORS.good : '#cbb98f';
      ctx.beginPath();
      ctx.arc(s.x + s.w / 2 + 26 + i * 18, s.y + s.h / 2 + 12, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    text(ctx, 'press E / click to chop', s.x + s.w / 2, s.y + s.h - 10, 10, '#5b3a1e');
  } else {
    text(ctx, 'tomato or lettuce here', s.x + s.w / 2, s.y + s.h / 2 + 12, 11, '#8a7a5a');
  }
  // Knife.
  ctx.save();
  ctx.translate(s.x + s.w - 34, s.y + 34);
  ctx.rotate(0.5 + Math.sin(nowMs / 240) * 0.05);
  ctx.fillStyle = '#c8d0d8';
  ctx.fillRect(-14, -3, 26, 6);
  ctx.fillStyle = '#5b3a1e';
  ctx.fillRect(12, -3, 10, 6);
  ctx.restore();
}

function drawGrill(ctx, game, highlight, nowMs) {
  drawStationBase(ctx, 'grill', 'GRILL — patties cook here', highlight);
  const s = STATIONS.grill;
  game.stations.grill.forEach((slot, i) => {
    const cx = s.x + 62 + i * 104;
    const cy = s.y + 62;
    ctx.fillStyle = '#3a3230';
    roundRect(ctx, cx - 44, cy - 26, 88, 52, 8);
    ctx.fill();
    // Flame flicker while a patty cooks, drawn after the patty so the
    // licks show around its edges.
    if (slot) {
      drawIngredientIcon(ctx, slot.kind, cx, cy, 18, slot.state);
      if (slot.state === 'raw') {
        const flick = Math.sin(nowMs / 90 + i * 2) * 3;
        ctx.fillStyle = 'rgba(245,166,35,0.9)';
        ctx.beginPath();
        ctx.moveTo(cx - 24, cy + 16);
        ctx.quadraticCurveTo(cx - 12, cy - 10 + flick, cx - 4, cy - 24 + flick);
        ctx.quadraticCurveTo(cx + 2, cy - 8 + flick, cx + 8, cy - 20 + flick);
        ctx.quadraticCurveTo(cx + 14, cy - 4 + flick, cx + 24, cy + 16);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(226,59,46,0.85)';
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy + 14);
        ctx.quadraticCurveTo(cx - 4, cy - 4, cx, cy - 14 + flick);
        ctx.quadraticCurveTo(cx + 5, cy - 2, cx + 10, cy + 14);
        ctx.closePath();
        ctx.fill();
      }
      const ratio = slot.state === 'raw'
        ? slot.cookedMs / 6000
        : slot.state === 'cooked' ? 1 - (slot.cookedMs - 6000) / 6000 : 0;
      const barColor = slot.state === 'burnt' ? COLORS.bad : slot.state === 'cooked' ? COLORS.good : COLORS.warn;
      ctx.fillStyle = '#241f1c';
      roundRect(ctx, cx - 36, cy + 30, 72, 7, 3);
      ctx.fill();
      ctx.fillStyle = barColor;
      roundRect(ctx, cx - 36, cy + 30, 72 * Math.max(0, Math.min(1, ratio)), 7, 3);
      ctx.fill();
      if (slot.state === 'cooked') text(ctx, 'READY!', cx, cy - 34, 11, COLORS.good);
      if (slot.state === 'burnt') text(ctx, 'BURNT!', cx, cy - 34, 11, COLORS.bad);
    } else {
      text(ctx, 'empty', cx, cy, 11, '#8a7a5a');
    }
  });
}

function drawWindow(ctx, game, highlight) {
  drawStationBase(ctx, 'window', 'SERVE', highlight);
  const s = STATIONS.window;
  ctx.fillStyle = '#7a4a22';
  ctx.fillRect(s.x + 8, s.y + 34, s.w - 16, 10);
  ctx.fillStyle = '#3a2d20';
  roundRect(ctx, s.x + 8, s.y + 52, s.w - 16, s.h - 66, 8);
  ctx.fill();
  text(ctx, 'WINDOW', s.x + s.w / 2, s.y + 72, 13, COLORS.gold);
  text(ctx, 'serve the', s.x + s.w / 2, s.y + 96, 11, COLORS.cream);
  text(ctx, 'finished dish', s.x + s.w / 2, s.y + 112, 11, COLORS.cream);
  text(ctx, 'here', s.x + s.w / 2, s.y + 128, 11, COLORS.cream);
  // Bell.
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(s.x + s.w / 2, s.y + s.h - 22, 10, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(s.x + s.w / 2 - 10, s.y + s.h - 22, 20, 4);
}

function drawPlateCounter(ctx, game, highlight) {
  drawStationBase(ctx, 'plate', 'PLATING COUNTER', highlight);
  const s = STATIONS.plate;
  const recipeId = recipeForPlate(game.stations.plate);
  const cx = s.x + s.w / 2;
  const cy = s.y + 52;
  if (recipeId) {
    const pulse = 0.5 + Math.sin(game.nowMs / 200) * 0.5;
    ctx.strokeStyle = `rgba(245,197,66,${0.5 + pulse * 0.5})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 66, 30, 0, 0, Math.PI * 2);
    ctx.stroke();
    text(ctx, `${RECIPES[recipeId].name.toUpperCase()} — READY TO SERVE!`, cx, s.y + s.h - 10, 12, COLORS.good);
  } else if (game.stations.plate.length === 0) {
    text(ctx, 'add prepped ingredients here', cx, s.y + s.h - 10, 11, '#8a7a5a');
  }
  drawPlateIcon(ctx, cx, cy, 56);
  game.stations.plate.forEach((label, i) => {
    const item = labelToIcon(label);
    drawIngredientIcon(ctx, item.kind, cx - 44 + i * 30, cy - 6, 12, item.state);
  });
  if (game.stations.plate.length > 0 && !recipeId) {
    const names = game.stations.plate.map((l) => l).join(' + ');
    text(ctx, names, cx, s.y + s.h - 10, 10, '#5b3a1e');
  }
}

function labelToIcon(label) {
  const parts = label.split(' ');
  if (parts.length === 1) return { kind: parts[0], state: 'raw' };
  return { kind: parts[1], state: parts[0] };
}

function drawTrash(ctx, game, highlight) {
  drawStationBase(ctx, 'trash', 'BIN', highlight);
  const s = STATIONS.trash;
  ctx.fillStyle = '#6b7280';
  roundRect(ctx, s.x + 22, s.y + 30, s.w - 44, s.h - 42, 6);
  ctx.fill();
  ctx.fillStyle = '#4b5563';
  ctx.fillRect(s.x + 16, s.y + 26, s.w - 32, 8);
  text(ctx, 'discard', s.x + s.w / 2, s.y + s.h - 10, 10, '#5b3a1e');
}

// --- chef --------------------------------------------------------------------
function drawPlayer(ctx, player) {
  const bob = player.moving ? Math.sin(player.walkPhase) * 2 : 0;
  const x = player.x;
  const y = player.y + bob;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, player.y + 18, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body (apron).
  ctx.fillStyle = '#f4f6f8';
  roundRect(ctx, x - 15, y - 6, 30, 26, 10);
  ctx.fill();
  ctx.fillStyle = '#3b6ea5';
  roundRect(ctx, x - 15, y + 8, 30, 12, 6);
  ctx.fill();
  // Head.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(x, y - 16, 12, 0, Math.PI * 2);
  ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - 7, y - 26, 7, 0, Math.PI * 2);
  ctx.arc(x + 7, y - 26, 7, 0, Math.PI * 2);
  ctx.arc(x, y - 28, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 11, y - 28, 22, 6);
  // Eyes look where the chef faces.
  const look = player.facing === 'left' ? -3 : player.facing === 'right' ? 3 : 0;
  ctx.fillStyle = '#2b2118';
  ctx.beginPath();
  ctx.arc(x - 4 + look, y - 16, 1.8, 0, Math.PI * 2);
  ctx.arc(x + 4 + look, y - 16, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Held item floats above the hat.
  if (player.hands) {
    const hy = y - 52;
    ctx.fillStyle = 'rgba(255,246,227,0.9)';
    ctx.beginPath();
    ctx.arc(x, hy, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, hy, 17, 0, Math.PI * 2);
    ctx.stroke();
    if (player.hands.dish) {
      drawPlateIcon(ctx, x, hy, 13);
    } else {
      drawIngredientIcon(ctx, player.hands.kind, x, hy, 12, player.hands.state);
    }
  }
}

// --- HUD ---------------------------------------------------------------------
function drawOrderTicket(ctx, order, x, y, nowMs) {
  const recipe = RECIPES[order.recipeId];
  const ratio = Math.max(0, order.patienceMs / order.patienceMaxMs);
  const urgent = ratio < 0.3;
  const flash = urgent && Math.sin(nowMs / 150) > 0;
  ctx.fillStyle = flash ? '#5a2320' : '#fff6e3';
  roundRect(ctx, x, y, 158, 76, 8);
  ctx.fill();
  ctx.strokeStyle = urgent ? COLORS.bad : '#cbb98f';
  ctx.lineWidth = urgent ? 3 : 2;
  roundRect(ctx, x, y, 158, 76, 8);
  ctx.stroke();
  text(ctx, `#${order.id} ${recipe.name}`, x + 8, y + 13, 11, COLORS.ink, 'left');
  recipe.needs.forEach((label, i) => {
    const item = labelToIcon(label);
    drawIngredientIcon(ctx, item.kind, x + 24 + i * 34, y + 36, 11, item.state);
  });
  text(ctx, `$${recipe.price}`, x + 140, y + 13, 12, COLORS.good, 'right');
  ctx.fillStyle = '#e0d3b8';
  roundRect(ctx, x + 10, y + 58, 138, 9, 4);
  ctx.fill();
  ctx.fillStyle = urgent ? COLORS.bad : ratio < 0.6 ? COLORS.warn : COLORS.good;
  roundRect(ctx, x + 10, y + 58, 138 * ratio, 9, 4);
  ctx.fill();
}

function drawHud(ctx, game) {
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);
  text(ctx, 'SIZZLE & SERVE', 118, 26, 24, COLORS.gold, 'center');
  text(ctx, 'rush-hour kitchen', 118, 52, 12, '#cbb98f', 'center');
  // Order tickets.
  game.orders.list.forEach((order, i) => {
    drawOrderTicket(ctx, order, 250 + i * 166, 8, game.nowMs);
  });
  if (game.orders.list.length === 0) {
    text(ctx, 'No orders yet — get ready…', 500, 46, 14, '#cbb98f');
  }
  // Money, timer, hearts.
  text(ctx, `$${game.orders.earned}`, 1050, 26, 26, COLORS.good, 'right');
  text(ctx, 'earned', 1050, 52, 11, '#cbb98f', 'right');
  const clock = shiftClockText(game);
  const lowTime = game.shiftMsLeft <= 30000;
  text(ctx, `TIME ${clock}`, 1180, 26, 24, lowTime ? COLORS.bad : COLORS.cream, 'right');
  const barW = 120;
  ctx.fillStyle = '#4a3a28';
  roundRect(ctx, 1060, 44, barW, 10, 5);
  ctx.fill();
  ctx.fillStyle = lowTime ? COLORS.bad : COLORS.gold;
  roundRect(ctx, 1060, 44, barW * (1 - shiftProgress(game)), 10, 5);
  ctx.fill();
  // Hearts.
  for (let i = 0; i < 3; i++) {
    text(ctx, i < game.hearts ? '♥' : '♡', 1080 + i * 26, 74, 18, i < game.hearts ? '#ff5a5a' : '#8a7a5a', 'center');
  }
  if (game.orders.combo > 1) {
    text(ctx, `COMBO x${game.orders.combo}`, 1000, 74, 13, COLORS.warn, 'right');
  }
}

function drawFloaters(ctx, game) {
  game.floaters.forEach((f, i) => {
    const age = (game.nowMs - f.bornMs) / f.lifeMs;
    ctx.globalAlpha = 1 - age;
    text(ctx, f.text, f.x, f.y - age * 26 - i * 20, 15, f.color);
    ctx.globalAlpha = 1;
  });
}

function drawHintBar(ctx, game, nearStation) {
  if (!nearStation) return;
  const label = STATIONS[nearStation].label;
  const hands = heldLabel(game.player.hands);
  const hint = hands ? `${label} — holding ${hands} · press E` : `${label} — press E`;
  ctx.fillStyle = 'rgba(43,33,24,0.85)';
  roundRect(ctx, CANVAS_WIDTH / 2 - 190, CANVAS_HEIGHT - 34, 380, 24, 12);
  ctx.fill();
  text(ctx, hint, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 22, 13, COLORS.cream);
}

// --- screens -------------------------------------------------------------------
function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(43,33,24,0.72)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  text(ctx, 'SIZZLE & SERVE', CANVAS_WIDTH / 2, 200, 54, COLORS.gold);
  text(ctx, 'A rush-hour kitchen game', CANVAS_WIDTH / 2, 252, 22, COLORS.cream);
  text(ctx, 'Tickets come in on the board. Grab ingredients from the fridge,', CANVAS_WIDTH / 2, 310, 17, COLORS.cream);
  text(ctx, 'chop them, grill the patties, build the dish on the plating counter,', CANVAS_WIDTH / 2, 336, 17, COLORS.cream);
  text(ctx, 'and serve it at the window before the ticket runs out!', CANVAS_WIDTH / 2, 362, 17, COLORS.cream);
  text(ctx, 'Move: WASD / arrows / click a station  ·  Use: E or click  ·  Fridge: keys 1-5', CANVAS_WIDTH / 2, 410, 15, COLORS.gold);
  const pulse = 0.6 + Math.sin(game.nowMs / 300) * 0.4;
  ctx.globalAlpha = pulse;
  text(ctx, 'Press ENTER or click to start the shift', CANVAS_WIDTH / 2, 470, 20, '#ffffff');
  ctx.globalAlpha = 1;
  text(ctx, '3-minute shift · serve fast for tips · 3 strikes and the shift ends', CANVAS_WIDTH / 2, 520, 14, '#cbb98f');
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(43,33,24,0.7)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  text(ctx, 'PAUSED', CANVAS_WIDTH / 2, 340, 48, COLORS.cream);
  text(ctx, 'Press P to keep cooking', CANVAS_WIDTH / 2, 400, 18, COLORS.gold);
}

function drawGameOver(ctx, game) {
  ctx.fillStyle = 'rgba(43,33,24,0.78)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  text(ctx, 'SHIFT OVER!', CANVAS_WIDTH / 2, 190, 48, COLORS.gold);
  text(ctx, `You earned $${game.orders.earned}`, CANVAS_WIDTH / 2, 260, 30, COLORS.cream);
  text(ctx, `Dishes served: ${game.orders.served}   ·   Orders missed: ${game.orders.missed}`, CANVAS_WIDTH / 2, 310, 18, COLORS.cream);
  const rank = game.orders.earned >= 150 ? 'Head Chef!' : game.orders.earned >= 90 ? 'Sous Chef — solid shift!' : game.orders.earned >= 40 ? 'Line Cook — keep practicing!' : 'Kitchen Helper — the rush beat you this time';
  text(ctx, rank, CANVAS_WIDTH / 2, 360, 20, COLORS.warn);
  text(ctx, 'Press R or ENTER to cook another shift', CANVAS_WIDTH / 2, 430, 18, '#ffffff');
}

export function renderGame(ctx, game, nearStation) {
  drawFloor(ctx);
  const highlight = nearStation;
  drawFridge(ctx, game, highlight === 'fridge');
  drawBoard(ctx, game, highlight === 'board', game.nowMs);
  drawGrill(ctx, game, highlight === 'grill', game.nowMs);
  drawWindow(ctx, game, highlight === 'window');
  drawPlateCounter(ctx, game, highlight === 'plate');
  drawTrash(ctx, game, highlight === 'trash');
  drawPlayer(ctx, game.player);
  drawFloaters(ctx, game);
  drawHud(ctx, game);
  if (game.screen === 'playing') drawHintBar(ctx, game, nearStation);
  if (game.screen === 'title') drawTitle(ctx, game);
  if (game.screen === 'paused') drawPaused(ctx);
  if (game.screen === 'over') drawGameOver(ctx, game);
  if (isMuted()) text(ctx, 'muted (M)', CANVAS_WIDTH - 14, CANVAS_HEIGHT - 14, 11, '#cbb98f', 'right');
}
