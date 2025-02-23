import { World } from './game/World.js';
import { Network } from './game/Network.js';
import { Combat } from './game/Combat.js';
import { Player } from './game/Player.js';

// Game constants
const CANVAS_WIDTH = window.innerWidth;
const CANVAS_HEIGHT = window.innerHeight;
const PLAYER_COLORS = [
    '#FF4136', // Red
    '#0074D9', // Blue
    '#2ECC40', // Green
    '#FFDC00', // Yellow
    '#B10DC9', // Purple
    '#FF851B'  // Orange
];

class WorldConquest {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        document.body.appendChild(this.canvas);

        // Initialize game modules
        this.world = new World(this.canvas);
        this.network = new Network();
        this.combat = new Combat(this.world);
        
        // Game state
        this.players = new Map();
        this.currentPlayer = null;
        this.selectedTerritory = null;
        this.gamePhase = 'waiting'; // waiting, placement, combat, fortify
        this.isHost = false;

        // Create UI
        this.createUI();
        
        // Bind event listeners
        this.bindEvents();
        
        // Initialize network handlers
        this.setupNetworkHandlers();
    }

    createUI() {
        const ui = document.createElement('div');
        ui.className = 'game-ui';
        ui.style.position = 'absolute';
        ui.style.top = '20px';
        ui.style.left = '20px';
        ui.style.zIndex = '1000';
        ui.style.color = '#fff';
        ui.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        
        // Player info section
        const playerInfo = document.createElement('div');
        playerInfo.className = 'player-info';
        playerInfo.innerHTML = '<h3>Player Info</h3><div id="player-status">Waiting for players...</div>';
        
        // Action buttons
        const actionButtons = document.createElement('div');
        actionButtons.className = 'action-buttons';
        actionButtons.style.marginTop = '20px';
        actionButtons.innerHTML = `
            <button id="host-game">Host Game</button>
            <button id="join-game">Join Game</button>
            <button id="start-game" disabled>Start Game</button>
            <button id="end-turn" disabled>End Turn</button>
        `;
        
        ui.appendChild(playerInfo);
        ui.appendChild(actionButtons);
        document.body.appendChild(ui);

        // Add some basic styles
        const style = document.createElement('style');
        style.textContent = `
            .game-ui button {
                margin: 5px;
                padding: 8px 16px;
                background: rgba(255,255,255,0.9);
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.2s;
            }
            .game-ui button:hover {
                background: rgba(255,255,255,1);
            }
            .game-ui button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
        `;
        document.head.appendChild(style);
    }

    setupNetworkHandlers() {
        this.network.onPlayerJoin = (player) => {
            this.addPlayer(player);
            this.updateUI();
        };

        this.network.onPlayerLeave = (playerId) => {
            this.players.delete(playerId);
            this.updateUI();
        };

        this.network.onGameStateUpdate = (state) => {
            this.updateGameState(state);
        };
    }

    bindEvents() {
        // Canvas events
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        // Window resize
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            if (this.world) {
                this.world.handleResize(this.canvas.width, this.canvas.height);
            }
        });

        // Button events
        document.getElementById('host-game').addEventListener('click', () => this.hostGame());
        document.getElementById('join-game').addEventListener('click', () => this.showJoinPrompt());
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        document.getElementById('end-turn').addEventListener('click', () => this.endTurn());
    }

    async hostGame() {
        this.isHost = true;
        const roomCode = await this.network.initializeHost();
        document.getElementById('host-game').disabled = true;
        document.getElementById('join-game').disabled = true;
        document.getElementById('start-game').disabled = false;
        
        // Add host as first player
        this.addPlayer({
            id: this.network.localId,
            name: 'Host',
            color: PLAYER_COLORS[0],
            isHost: true
        });
    }

    showJoinPrompt() {
        const roomCode = prompt('Enter room code:');
        if (roomCode) {
            this.joinGame(roomCode);
        }
    }

    async joinGame(roomCode) {
        try {
            await this.network.joinGame(roomCode);
            document.getElementById('host-game').disabled = true;
            document.getElementById('join-game').disabled = true;
            
            // Add self as player
            this.addPlayer({
                id: this.network.localId,
                name: `Player ${this.players.size + 1}`,
                color: PLAYER_COLORS[this.players.size],
                isHost: false
            });
        } catch (error) {
            alert('Failed to join game: ' + error.message);
        }
    }

    addPlayer(playerData) {
        const player = new Player(
            playerData.id,
            playerData.name,
            playerData.color
        );
        this.players.set(playerData.id, player);
        this.updateUI();
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const territory = this.world.getTerritoryAtPoint(x, y);
        if (territory) {
            this.handleTerritoryClick(territory);
        }
    }

    handleTerritoryClick(territory) {
        if (!this.currentPlayer || this.currentPlayer.id !== this.network.localId) {
            return; // Not player's turn
        }

        switch (this.gamePhase) {
            case 'placement':
                if (this.currentPlayer.canReinforce()) {
                    if (territory.owner === this.currentPlayer) {
                        territory.armies++;
                        this.currentPlayer.useReinforcements(1);
                        this.network.broadcastToAll({
                            type: 'action',
                            data: {
                                type: 'placement',
                                territory: territory.name,
                                armies: territory.armies
                            }
                        });
                    }
                }
                break;

            case 'combat':
                if (!this.selectedTerritory) {
                    if (territory.owner === this.currentPlayer && territory.armies > 1) {
                        this.selectedTerritory = territory;
                        territory.mesh.children.forEach(child => {
                            if (child.material) {
                                child.material.emissive.setHex(0x444444);
                            }
                        });
                    }
                } else {
                    if (this.combat.canAttack(this.selectedTerritory, territory)) {
                        const outcome = this.combat.resolveCombat(this.selectedTerritory, territory);
                        this.handleCombatOutcome(outcome, this.selectedTerritory, territory);
                    }
                    // Reset selected territory highlight
                    this.selectedTerritory.mesh.children.forEach(child => {
                        if (child.material) {
                            child.material.emissive.setHex(0x000000);
                        }
                    });
                    this.selectedTerritory = null;
                }
                break;

            case 'fortify':
                // Similar to combat selection but for moving armies
                break;
        }

        this.updateUI();
    }

    handleCombatOutcome(outcome, attacker, defender) {
        // Update territories based on combat outcome
        attacker.armies = outcome.remainingAttackers;
        defender.armies = outcome.remainingDefenders;

        if (outcome.territoryConquered) {
            defender.owner.removeTerritory(defender.name);
            this.currentPlayer.addTerritory(defender.name);
            defender.owner = this.currentPlayer;
            defender.armies = Math.floor(attacker.armies / 2);
            attacker.armies = Math.ceil(attacker.armies / 2);
        }

        // Broadcast combat result
        this.network.broadcastToAll({
            type: 'action',
            data: {
                type: 'combat',
                outcome: outcome,
                attacker: attacker.name,
                defender: defender.name
            }
        });

        this.checkGameEnd();
    }

    startGame() {
        if (!this.isHost || this.players.size < 2) return;

        this.world.initialize().then(() => {
            // Randomly distribute territories
            const territories = Array.from(this.world.territories.keys());
            const players = Array.from(this.players.values());
            
            while (territories.length > 0) {
                for (const player of players) {
                    if (territories.length === 0) break;
                    const index = Math.floor(Math.random() * territories.length);
                    const territory = territories.splice(index, 1)[0];
                    player.addTerritory(territory);
                    this.world.updateTerritory(territory, { owner: player, armies: 1 });
                }
            }

            // Set initial phase and player
            this.gamePhase = 'placement';
            this.currentPlayer = players[0];
            
            // Give initial reinforcements
            players.forEach(player => {
                player.addReinforcements(player.calculateReinforcements(this.world));
            });

            // Broadcast game start
            this.network.broadcastToAll({
                type: 'gameState',
                data: this.getGameState()
            });

            document.getElementById('start-game').disabled = true;
            document.getElementById('end-turn').disabled = false;
        });
    }

    endTurn() {
        if (!this.currentPlayer || this.currentPlayer.id !== this.network.localId) return;

        // Find next player
        const players = Array.from(this.players.values());
        const currentIndex = players.findIndex(p => p.id === this.currentPlayer.id);
        this.currentPlayer = players[(currentIndex + 1) % players.length];

        // Update phase if needed
        if (this.gamePhase === 'placement' && !this.currentPlayer.canReinforce()) {
            this.gamePhase = 'combat';
        }

        // Give reinforcements at the start of turn
        if (this.gamePhase === 'placement') {
            this.currentPlayer.addReinforcements(
                this.currentPlayer.calculateReinforcements(this.world)
            );
        }

        // Broadcast turn end
        this.network.broadcastToAll({
            type: 'gameState',
            data: this.getGameState()
        });

        this.updateUI();
    }

    checkGameEnd() {
        const activePlayers = Array.from(this.players.values())
            .filter(player => !player.isDefeated());

        if (activePlayers.length === 1) {
            alert(`Game Over! ${activePlayers[0].name} wins!`);
            // Handle game end cleanup
        }
    }

    getGameState() {
        return {
            territories: Array.from(this.world.territories.entries()),
            currentPlayer: this.currentPlayer.id,
            gamePhase: this.gamePhase,
            players: Array.from(this.players.values()).map(p => p.toJSON())
        };
    }

    updateGameState(state) {
        // Update territories
        state.territories.forEach(([name, data]) => {
            this.world.updateTerritory(name, data);
        });

        // Update players
        state.players.forEach(playerData => {
            if (!this.players.has(playerData.id)) {
                this.players.set(playerData.id, Player.fromJSON(playerData));
            } else {
                Object.assign(this.players.get(playerData.id), playerData);
            }
        });

        this.currentPlayer = this.players.get(state.currentPlayer);
        this.gamePhase = state.gamePhase;

        this.updateUI();
    }

    updateUI() {
        const statusEl = document.getElementById('player-status');
        const endTurnBtn = document.getElementById('end-turn');

        if (this.currentPlayer) {
            statusEl.innerHTML = `
                Current Player: ${this.currentPlayer.name}<br>
                Phase: ${this.gamePhase}<br>
                ${this.gamePhase === 'placement' ? `Reinforcements: ${this.currentPlayer.reinforcements}` : ''}
            `;
            endTurnBtn.disabled = this.currentPlayer.id !== this.network.localId;
        }
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new WorldConquest();
});
