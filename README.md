[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/antololcrazy1/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/antololcrazy1/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

# Sizzle & Serve — Rush-Hour Kitchen

A complete, original 2D cooking game built for the
[make.fun "Make the best cooking game" bounty](https://make.fun/bounty/best-cooking-game-20261125-0137).
You are the chef on a 3-minute dinner rush: tickets come in on the order
board, and you grab ingredients from the fridge, chop them on the board,
grill the patties, build each dish on the plating counter, and serve it at
the window before the ticket runs out. Serve fast for tips, chain serves
for combos — and don't let three tickets expire, or the shift ends early.

## How to play

- **Move:** WASD / arrow keys, or click a station to walk there.
- **Use a station:** `E` (or click the station).
- **Fridge:** click an ingredient, or press `1`–`5` while standing at it
  (bread, patty, tomato, lettuce, cheese).
- **Chopping board:** put tomato or lettuce on it, chop 3 times, take it back.
- **Grill:** patties cook in 6 seconds — grab them before they burn.
- **Plating counter:** add prepped ingredients; when the plate matches a
  recipe it becomes a finished dish. Take it and serve it at the window.
- **Bin:** throw away anything you don't need. `P` pauses, `M` mutes.

Four recipes: Classic Burger, Cheeseburger, Garden Salad, Golden Melt.
Orders arrive faster as the shift goes on, and their patience shrinks.

## Run it

Serve `game/` with any static HTTP server and open `game/index.html` in a
desktop browser — no build step, no network requests, every asset is drawn
in code. For example:

```sh
cd game && python3 -m http.server 8080
```

## Layout

- `game/index.html` — page shell and canvas.
- `game/src/config.js` — constants, ingredients, recipes, stations.
- `game/src/kitchen.js` — game state, update step and interaction rules.
- `game/src/stations.js` — what each station holds and does.
- `game/src/orders.js` — the order board: spawning, patience, tips.
- `game/src/player.js` — the chef: movement, carrying, collision.
- `game/src/input.js` — keyboard and mouse state.
- `game/src/render.js` — every pixel: kitchen, chef, tickets, screens.
- `game/src/audio.js` — synthesized WebAudio sounds (no audio files).
- `game/src/main.js` — boot and the game loop.
- `screenshots/` — four real renders of the game running in a browser.

## License

MIT — see [LICENSE](LICENSE).
