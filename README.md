# Calculus Adventure: The Math Kingdom

A pixel-style web adventure game. Walk the overworld, take quests, enter castles, and fight zombie swarms with a sword and a pistol.

## Play it

- **On your computer:** open `index.html` in your browser.
- **On GitHub Pages:** Settings -> Pages -> branch `main`, folder `/ (root)`.

## Controls

| Action | Keyboard | Phone |
| --- | --- | --- |
| Walk (map) | Arrows or WASD | arrow buttons |
| Move (castle) | A / D or arrows | left / right buttons |
| Jump | W, Up arrow, or Space | Jump button |
| Sword | J or X | Sword button |
| Pistol | K or Z, or click the screen | Gun button |
| Reload | R | (auto when empty) |
| Talk / open chest / shop / quest | E | Act button |
| Quest log | Q | Quests button |
| Hide / show corner map | M | |

## Files (all in the repo root, no folders)

```
index.html          title screen
game.html           the game (loading screen, map, castles)
home.css            title screen styles
game.css            game styles
game.js             map, quests, castles, zombies, pistol, health, loading
sound.js            sound effects (Web Audio API)
music.js            music player
zombie.png          zombie sprite sheet (6 frames, 105 x 85 each)
overworld-day.mp3   map music
terraria-theme.mp3  title and castle music
```

## v4 features

- **Five big biomes** (64 x 42 tiles each): Greenlands, Frozen Tundra, Scorched Desert, Haunted Swamp and Ember Peaks. Each has its own trees, rocks, water (lava in the Ember Peaks), roads, villagers, chests and castle look.
- **Ten castles**, two or three per biome, ending with the Castle of Infinity and Lord Infinity. Clear every castle in a biome to open its portal to the next one.
- **Quest system:** 25 quests. Villagers with a gold `!` have a quest, a green `?` means a quest is ready to turn in. Quest types: talk, defeat zombies, open chests, earn coins, buy upgrades, clear a castle, reach a biome. Rewards are coins and sometimes a free upgrade. Press **Q** for the quest log; active quests also show under your coins.
- **Corner map:** shows castles (red = not cleared, green = cleared), portals, quest givers and you. Press **M** to hide it.
- **New zombie sprite** from `zombie.png`: walk cycle, reaching pose when near you, an alert pose for the boss lunge and a fallen pose when defeated. Each biome tints the zombies a different colour.
- **Save data** uses new keys, so progress from the older version starts fresh.
