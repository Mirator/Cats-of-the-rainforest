## Title: Cats of the Rainforest

## High Concept

Cats of the Rainforest is a strategy and tower-defense game where a cat tribe protects a rainforest clearing from masked mice attempting to convert it into monoculture fields. The player gathers resources during the day and defends the forest at night, aiming to survive five enemy waves and preserve the rainforest.

## Genre & Platform

**Genre:** Strategy / Tower Defense  
**Visual Style:** 3D (Three.js)  
**Technology:** JavaScript (ES6 modules)  
**Platform:** PC (Web browser)  
**Session Length:** 10–15 minutes

## Core Loop

**Day Phase** → Gather Resources → Build Structures → Train Cats → **End Day** → **Night Phase** → Defend Against Wave → **Repeat** for 5 waves

## Gameplay Systems

### Day Phase (Player-Controlled)

During the day, the player can:

- **Gather Resources**: Hold Space near trees to cut them down. Each tree costs 1 stamina and yields 1 food + 1 wood. Trees have a cutting progress bar and fall animation.
- **Build Structures**: Press B to enter build mode. Available structures:
  - **Cat Den** (3 wood, 1 stamina): Spawns cat units. Must be within 15 units of Forest Totem.
  - **Tower** (5 wood, 1 stamina): Defensive structure that requires a cat assignment. Must be within 15 units of Forest Totem.
- **Train Cats**: Hold Space near a Cat Den to spawn a cat (costs 1 food + 1 stamina, takes 3 seconds).
- **Assign Cats to Towers**: Press Space near a tower during day to assign/unassign the nearest available cat.
- **End Day**: Click "End Day" button or wait until ready. Player decides when to trigger night.

**Stamina System**: Player has 10 stamina that refreshes each new day. Stamina is consumed for:
- Cutting trees (1 stamina)
- Building structures (1 stamina per structure)
- Spawning cats (1 stamina per cat)

**Resource System**:
- **Food**: Gained from cutting trees (1 per tree). Used to spawn cats (1 per cat).
- **Wood**: Gained from cutting trees (1 per tree). Used to build structures (3 for Cat Den, 5 for Tower).

**MiceAlert System**: Trees cut during the day increase enemy count for that night's wave (0.5 extra enemies per tree, max 10 extra enemies).

### Night Phase (Automatic Defense)

When night begins:

- **Enemy Waves**: Masked mice spawn from map edges and pathfind to the Forest Totem.
- **Automatic Defense**: 
  - Cats idle near the totem and will engage enemies in range.
  - Towers with assigned cats automatically attack enemies within 8 units (2 damage, 1.5s cooldown).
- **Player Actions**: Player can move (WASD/Arrow keys) and attack enemies with F key (1 damage, 0.8s cooldown, 1.5 unit range, 120° arc).
- **Building/Gathering Disabled**: Cannot cut trees or interact with buildings at night.
- **Wave Completion**: Wave ends when all enemies are spawned and killed. Automatically transitions to next day.

### Wave System

The game consists of 5 waves:

- **Wave 1**: 8 regular mice, 5s spawn interval
- **Wave 2**: 18 regular mice, 8s spawn interval
- **Wave 3**: 25 enemies (70% regular, 30% fast), 6s spawn interval
- **Wave 4**: 35 enemies (60% regular, 40% fast), 5s spawn interval
- **Wave 5**: 1 strong mouse (boss, 5x HP multiplier, 3x visual scale), instant spawn

Enemy stats scale with wave (HP multipliers: 1.0, 1.2, 1.4, 1.6, 5.0). Trees cut during the day add extra enemies (miceAlert) to waves 1-4.

## Units & Entities

### Cat Tribe Units

- **Spawned from Cat Dens** using food and stamina
- **Idle near Forest Totem** when not assigned
- **Can be assigned to Towers** during day (Space near tower)
- **Automatically defend** by engaging enemies in range
- **Visual variety**: Random body colors and mask colors (inherits player's mask color)

### Mouse Enemies

Three enemy types:

- **Regular Mouse**: Base speed 4.5, 1 HP (scaled by wave), 5 damage to totem
- **Fast Mouse**: Speed 6.5, appears in waves 3-4
- **Strong Mouse** (Boss): Speed 0.5, 5x HP multiplier, 3x visual scale, appears in wave 5

All enemies:
- Spawn at map edges
- Pathfind around trees to reach Forest Totem
- Attack totem when in range (1.5 units)
- Deal 5 damage per attack to totem
- Can be killed by player, cats, or towers

### Structures

- **Forest Totem**: Central objective at map center. 100 HP. If destroyed, game over. Has 15-unit influence radius for building placement.
- **Cat Den**: Spawns cats. Requires interaction (hold Space) to spawn (3s duration, costs 1 food + 1 stamina).
- **Tower**: Defensive structure. Requires cat assignment to function. Attacks enemies within 8 units (2 damage, 1.5s cooldown). Can assign/unassign cats during day.

### Trees

- **80 trees** randomly placed on map (avoiding center area)
- **Can be cut** during day (hold Space, costs 1 stamina)
- **Yield resources** when fully cut (1 food + 1 wood)
- **Affect pathfinding** - enemies navigate around them
- **Animated** with wind sway and falling animations

## Map & World

- **Map Size**: 120x120 units
- **Boundaries**: Visible boundary markers at edges
- **Camera**: Follows player with boundary slowdown, transitions to overhead view for victory screenshot
- **Day/Night Visuals**: Smooth transitions between day (bright, green fog) and night (dark, reduced lighting)
- **Particle Effects**: Visual feedback for tree cutting, cat spawning, building completion, enemy death

## Controls

- **Movement**: WASD or Arrow Keys
- **Interact**: Space (hold for tree cutting, cat spawning)
- **Attack**: F (night phase only)
- **Build Mode**: B (toggle)
- **Exit Build Mode**: Escape
- **Build Menu**: Number keys 1-9, Arrow keys + Enter
- **Placement**: Mouse or WASD/Arrow keys (in placement mode)
- **Confirm Build**: Enter or Space
- **Cancel Build**: Escape or Right Click

## Objective and Failure

### Win Condition

Survive all 5 night waves. After wave 5 is completed:
- UI is hidden
- Camera transitions to overhead view framing entire map
- Screenshot is automatically captured
- Win screen displays with downloadable screenshot (the "masterpiece")

### Lose Condition

The Forest Totem is destroyed (reaches 0 HP). Game over screen is displayed.

## Visual Style

- **3D Environment**: Three.js-based 3D world with models (GLB format)
- **Day/Night Cycle**: Dynamic lighting and fog transitions (2-second smooth transitions)
- **Color Palettes**: 
  - Player and cats have varied body colors and mask colors
  - Random color selection from predefined palettes
- **Animations**: 
  - Player and cat models with procedural leg, head, and tail animations
  - Tree wind sway and falling animations
  - Particle effects for key events
- **UI**: Overhead health bars, progress bars, tooltips, resource display, wave counter, stamina display

## Technical Implementation

- **Engine**: Three.js for 3D rendering
- **Pathfinding**: Custom pathfinding system that recalculates routes around trees
- **Build System**: Grid-based placement (1-unit grid) with validation
- **Resource Management**: Centralized resource system with event listeners
- **State Management**: Day/Night state system, Build Mode state machine
- **Enemy AI**: Pathfinding to totem, attack behavior, collision detection

## Theme Alignment

- **Outgrow Hunger**: Balancing food production (cutting trees) with sustainability (trees affect enemy pathfinding and wave difficulty)
- **All in for Nature (Rainforest)**: Protecting the Forest Totem and rainforest ecosystem from destruction
- **Masterpiece**: Final map screenshot captured as unique artwork representing the player's journey
- **Procedural Elements**: Random tree placement, varied enemy spawns, color palette variations

## One-Sentence Pitch

A strategy game where a cat tribe defends the rainforest from masked mice seeking to destroy the Forest Totem, balancing resource gathering, building construction, and unit management across five increasingly difficult waves.
