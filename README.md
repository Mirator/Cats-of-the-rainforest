# Cats of the Rainforest

A strategy and tower-defense game where a cat tribe protects a rainforest clearing from masked mice. Gather resources during the day and defend the forest at night across 5 waves. Made for Global Game Jam 2026.

## Setup

```bash
npm install
npm run dev
```

Open your browser to the URL shown (typically `http://localhost:3000`)

## Itch.io build

```bash
npm run itch:zip
```

This creates `cats-of-the-rainforest-itch.zip` in the project root, ready to upload as an HTML5 game on itch.io.

## Controls

- **WASD/Arrow Keys**: Move player
- **Space**: Hold to cut trees, spawn cats, or interact
- **F**: Attack enemies (night phase)
- **B**: Toggle build mode | **Escape**: Exit build mode
- **Number Keys (1-9)**: Select structure | **Enter/Space**: Confirm | **Escape/Right Click**: Cancel

## Gameplay

**Day Phase**: Cut trees (food + wood), build Cat Dens and Towers, train cats, assign cats to towers.  
**Night Phase**: Defend the Forest Totem from enemy waves. Survive all 5 waves to win.
