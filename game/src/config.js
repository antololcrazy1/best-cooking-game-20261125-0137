// config.js — every constant that shapes Sizzle & Serve: the kitchen, the
// ingredients, the recipes, the shift clock and the difficulty ramp.
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;
export const HUD_HEIGHT = 92;

export const SHIFT_SECONDS = 180;
export const MAX_HEARTS = 3;
export const MAX_ORDERS = 4;
export const COMBO_WINDOW_MS = 12000;

// One ingredient kind per entry. `prep` says what a station must do to it
// before it can go on a plate; `key` is the fridge shortcut.
export const INGREDIENTS = {
  bread:   { name: 'Bread',   color: '#e8b96a', prep: 'none',    key: '1' },
  patty:   { name: 'Patty',   color: '#8a5a33', prep: 'cooked',  key: '2' },
  tomato:  { name: 'Tomato',  color: '#e23b2e', prep: 'chopped', key: '3' },
  lettuce: { name: 'Lettuce', color: '#58b368', prep: 'chopped', key: '4' },
  cheese:  { name: 'Cheese',  color: '#f5c542', prep: 'none',    key: '5' },
};

export const INGREDIENT_ORDER = ['bread', 'patty', 'tomato', 'lettuce', 'cheese'];

// A recipe is a multiset of prepared ingredients. `needs` uses the prepared
// form: 'chopped tomato', 'cooked patty', plain 'bread' / 'cheese'.
export const RECIPES = {
  burger: {
    name: 'Classic Burger',
    price: 12,
    needs: ['bread', 'cooked patty', 'chopped lettuce'],
  },
  cheeseburger: {
    name: 'Cheeseburger',
    price: 16,
    needs: ['bread', 'cooked patty', 'cheese', 'chopped tomato'],
  },
  salad: {
    name: 'Garden Salad',
    price: 10,
    needs: ['chopped tomato', 'chopped lettuce', 'cheese'],
  },
  melt: {
    name: 'Golden Melt',
    price: 11,
    needs: ['bread', 'cheese', 'chopped tomato'],
  },
};

export const RECIPE_ORDER = ['burger', 'cheeseburger', 'salad', 'melt'];

// Stations sit around the kitchen walls. `approach` is where the chef
// stands to use one.
export const STATIONS = {
  fridge: { label: 'Fridge', x: 36, y: 120, w: 170, h: 120 },
  board:  { label: 'Chopping Board', x: 268, y: 120, w: 170, h: 100 },
  grill:  { label: 'Grill', x: 852, y: 120, w: 228, h: 110 },
  window: { label: 'Serving Window', x: 1150, y: 280, w: 96, h: 180 },
  plate:  { label: 'Plating Counter', x: 470, y: 580, w: 340, h: 90 },
  trash:  { label: 'Bin', x: 36, y: 580, w: 90, h: 90 },
};

export const PLAYER_SPEED = 270;
export const PLAYER_RADIUS = 20;

export const CHOP_HITS = 3;
export const GRILL_COOK_MS = 6000;
export const GRILL_BURN_MS = 12000;

// Patience (seconds) of a fresh order, and how fast new orders arrive,
// at the start of the shift and at the end of it.
export const ORDER_PATIENCE_START = 55;
export const ORDER_PATIENCE_END = 34;
export const SPAWN_GAP_START_MS = 14000;
export const SPAWN_GAP_END_MS = 7500;

export const TIP_MAX = 5;

export const COLORS = {
  floorA: '#c98d5f',
  floorB: '#bd7f52',
  wall: '#f3e3c8',
  counterWood: '#a9713d',
  counterTop: '#c98f56',
  steel: '#b9c2cc',
  steelDark: '#8d99a8',
  hud: '#2b2118',
  hudPanel: '#3a2d20',
  cream: '#fff6e3',
  ink: '#2b2118',
  good: '#58b368',
  warn: '#f5a623',
  bad: '#e23b2e',
  gold: '#f5c542',
};
