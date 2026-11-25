// input.js — keyboard and mouse state, plus click-to-move targets. The game
// never reads input anywhere else; every other module asks this one.
const keysDown = new Set();
let clickTarget = null; // {x, y, station} | null
let clickQueued = false;
let interactQueued = false;

export function bindInput(canvas, handlers) {
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    keysDown.add(event.key.toLowerCase());
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(event.key.toLowerCase())) {
      event.preventDefault();
    }
    if (event.key === 'e' || event.key === 'E' || event.key === ' ') {
      interactQueued = true;
    }
    if (handlers.onKey) handlers.onKey(event.key.toLowerCase());
  });
  window.addEventListener('keyup', (event) => {
    keysDown.delete(event.key.toLowerCase());
  });
  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    clickTarget = { x, y, station: null };
    clickQueued = true;
    if (handlers.onClick) handlers.onClick(x, y);
  });
  window.addEventListener('blur', () => keysDown.clear());
}

export function moveVector() {
  let dx = 0;
  let dy = 0;
  if (keysDown.has('a') || keysDown.has('arrowleft')) dx -= 1;
  if (keysDown.has('d') || keysDown.has('arrowright')) dx += 1;
  if (keysDown.has('w') || keysDown.has('arrowup')) dy -= 1;
  if (keysDown.has('s') || keysDown.has('arrowdown')) dy += 1;
  if (dx !== 0 && dy !== 0) {
    dx *= Math.SQRT1_2;
    dy *= Math.SQRT1_2;
  }
  return { dx, dy };
}

export function takeClickTarget() {
  const target = clickTarget;
  clickTarget = null;
  return target;
}

export function peekClickTarget() {
  return clickTarget;
}

export function setClickTarget(target) {
  clickTarget = target;
}

export function clearClickTarget() {
  clickTarget = null;
}

export function takeClickQueued() {
  const queued = clickQueued;
  clickQueued = false;
  return queued;
}

export function takeInteractQueued() {
  const queued = interactQueued;
  interactQueued = false;
  return queued;
}

export function isKeyDown(key) {
  return keysDown.has(key.toLowerCase());
}
