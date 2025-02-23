# World Conquest

A multiplayer strategy game implemented in JavaScript using WebRTC for peer-to-peer networking.

## Technical Implementation

### Core Architecture
The game is built with a modular architecture consisting of several key components:
- `WorldConquest`: Main game controller that coordinates all game modules and manages the game loop
- `World`: Handles map rendering and territory management using D3.js for geographic projections
- `Combat`: Implements strategic combat resolution system
- `Network`: Manages peer-to-peer connections using WebRTC
- `Player`: Handles player state and actions

### World Management
- Uses GeoJSON data for world map representation
- D3.js Mercator projection for map rendering
- Territory system with properties:
  - Strategic value calculated from size and location
  - Neighbor relationships
  - Army counts
  - Owner information

### Networking
- Peer-to-peer implementation using WebRTC
- Room-based game sessions with unique codes
- State synchronization between players
- Action broadcasting system for game events
- Host/client architecture with host managing game state

### Combat System
Combat resolution uses multiple strategic factors:
- Army size ratios
- Territory strategic values
- Adjacent territory control bonuses
- Supply line mechanics
  - Territories connected to starting positions get 20% strength bonus
  - Isolated territories suffer 20% strength penalty
- Defender's advantage (20% base bonus)

### Game State Management
- Turn-based gameplay with phases:
  1. Placement: Deploy reinforcements
  2. Combat: Attack enemy territories
  3. Fortify: Reorganize armies
- Reinforcement calculation based on:
  - Controlled territories
  - Continental bonuses
  - Supply line integrity

## Dependencies
Check for updates:
```bash
npm outdated
```

Update all dependencies:
```bash
npm update
```
