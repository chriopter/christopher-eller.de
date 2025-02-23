wimport { Network } from './game/Network.js';
import { Game } from './game/game.js';

class ChatApp {
    constructor() {
        // Initialize DOM elements
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.messagesContainer = document.getElementById('messages');
        this.statusElement = document.getElementById('connection-status');
        this.roomCodeDisplay = document.getElementById('room-code-display');
        this.roomCodeElement = document.getElementById('room-code');
        this.roomCodeInput = document.getElementById('room-code-input');
        this.roomCodeContainer = document.getElementById('room-code-display');
        this.copyFeedback = document.getElementById('copy-feedback');
        this.statusDot = document.getElementById('connection-status-dot');
        this.leaveRoomButton = document.getElementById('leave-room');
        this.playerNameInput = document.getElementById('player-name');
        this.gameWrapper = document.getElementById('game-wrapper');
        this.roomControls = document.querySelector('.room-controls');

        // Validate required DOM elements
        if (!this.messageInput) throw new Error('Message input element not found');
        if (!this.sendButton) throw new Error('Send button element not found');
        if (!this.messagesContainer) throw new Error('Messages container element not found');
        if (!this.statusElement) throw new Error('Status element not found');
        if (!this.roomCodeDisplay) throw new Error('Room code display element not found');
        if (!this.roomCodeElement) throw new Error('Room code element not found');
        if (!this.roomCodeInput) throw new Error('Room code input element not found');
        if (!this.roomCodeContainer) throw new Error('Room code container element not found');
        if (!this.copyFeedback) throw new Error('Copy feedback element not found');
        if (!this.statusDot) throw new Error('Status dot element not found');
        if (!this.leaveRoomButton) throw new Error('Leave room button element not found');
        if (!this.playerNameInput) throw new Error('Player name input element not found');

        // Initialize game and network
        this.game = new Game();
        this.network = new Network();
        this.isMyTurn = false;
        
        this.setupNetworkHandlers();
        this.setupUIHandlers();
        this.loadGameUI();

        // Check for stored room code
        const storedRoomCode = sessionStorage.getItem('roomCode');
        if (storedRoomCode) {
            this.attemptReconnect(storedRoomCode);
        }
    }

    setupNetworkHandlers() {
        this.network.onMessageReceived = (peerId, message) => {
            this.displayMessage(message, 'received');
        };

        this.network.onStatusUpdate = (status) => {
            // Don't override custom success/error messages with default "Room created" message
            if (this.statusElement.textContent !== 'Room created successfully' && 
                this.statusElement.textContent !== 'Joined room successfully' &&
                !this.statusElement.textContent.startsWith('Failed to')) {
                this.statusElement.textContent = status;
            }
            
            const roomCode = this.network.getRoomCode();
            if (roomCode) {
                this.roomCodeDisplay.style.display = 'block';
                this.roomCodeElement.textContent = roomCode;
                this.leaveRoomButton.style.display = 'block';
                if (this.roomControls) {
                    this.roomControls.style.display = 'none';
                }
                sessionStorage.setItem('roomCode', roomCode);
                this.statusDot.classList.add('connected');
            } else {
                this.roomCodeDisplay.style.display = 'none';
                this.leaveRoomButton.style.display = 'none';
                if (this.roomControls) {
                    this.roomControls.style.display = 'flex';
                }
                sessionStorage.removeItem('roomCode');
                this.statusDot.classList.remove('connected');
            }
        };

        this.network.onPeerJoin = () => {
            this.messageInput.disabled = false;
            this.sendButton.disabled = false;
            this.gameStatus.textContent = "Game started! Blue's turn";
            this.isMyTurn = this.network.isHost;
            this.updateGameBoard(this.game.board);
            this.updatePlayerInfo();
        };

        this.network.onPeerLeave = () => {
            this.messageInput.disabled = true;
            this.sendButton.disabled = true;
            this.gameStatus.textContent = "Waiting for opponent...";
            this.resetGameButton.style.display = 'none';
            this.nextPhaseButton.style.display = 'none';
            this.game.reset();
            this.updateGameBoard(this.game.board);
            
            // Reset opponent info
            document.querySelector('.opponent-name').textContent = 'Waiting for opponent...';
            document.querySelector('.opponent-symbol').textContent = '';
            document.querySelector('.opponent-player').classList.remove('active');
            document.querySelector('.current-player').classList.remove('active');
        };
    }

    async loadGameUI() {
        try {
            const response = await fetch('src/game/game.html');
            const html = await response.text();
            this.gameWrapper.innerHTML = html;
            
            // Initialize game elements after loading
            this.gameStatus = document.querySelector('.game-status');
            this.gameBoard = document.querySelector('.game-board');
            this.resetGameButton = document.getElementById('reset-game');
            this.nextPhaseButton = document.getElementById('next-phase-button');
            this.troopsCount = document.getElementById('troops-count');
            
            this.initializeGameBoard();
            this.setupGameHandlers();
        } catch (error) {
            console.error('Failed to load game UI:', error);
        }
    }

    initializeGameBoard() {
        this.gameBoard.innerHTML = '';
        for (let i = 0; i < 36; i++) { // 6x6 grid
            const cell = document.createElement('div');
            cell.className = 'game-cell';
            cell.dataset.index = i;
            
            const troopsCount = document.createElement('div');
            troopsCount.className = 'troops-count';
            cell.appendChild(troopsCount);
            
            this.gameBoard.appendChild(cell);
        }
    }

    setupGameHandlers() {
        this.game.onGameUpdate = (state) => {
            this.updateGameBoard(state);
            this.updatePhaseIndicators(state);
            
            if (state.winner) {
                this.gameStatus.textContent = `${state.winner} wins!`;
                this.resetGameButton.style.display = 'block';
                this.nextPhaseButton.style.display = 'none';
            } else {
                this.gameStatus.textContent = `${state.currentPlayer}'s turn - ${state.currentPhase} phase`;
                this.troopsCount.textContent = state.troopsToPlace;
            }
            
            // Update active player indicators
            const isCurrentTurn = state.currentPlayer === (this.network.isHost ? 'blue' : 'red');
            document.querySelector('.current-player').classList.toggle('active', isCurrentTurn);
            document.querySelector('.opponent-player').classList.toggle('active', !isCurrentTurn);
        };

        this.gameBoard.addEventListener('click', (event) => {
            const cell = event.target.closest('.game-cell');
            if (!cell) return;
            
            if (!this.isMyTurn) {
                this.gameStatus.textContent = "Wait for your turn!";
                return;
            }

            const index = parseInt(cell.dataset.index);
            if (this.game.makeMove(index)) {
                this.network.sendGameMove(index);
                this.isMyTurn = false;
            }
        });

        this.nextPhaseButton.addEventListener('click', () => {
            if (this.game.nextPhase()) {
                this.network.sendGamePhase();
            }
        });

        this.resetGameButton.addEventListener('click', () => {
            this.game.reset();
            this.isMyTurn = this.network.isHost;
            this.resetGameButton.style.display = 'none';
            this.nextPhaseButton.style.display = 'block';
            this.initializeGameBoard();
        });

        this.network.onGameMove = (index) => {
            this.game.makeMove(index);
            this.isMyTurn = true;
        };

        this.network.onGamePhase = () => {
            this.game.nextPhase();
            this.isMyTurn = true;
        };
    }

    updateGameBoard(state) {
        const cells = this.gameBoard.children;
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const territory = state.board[i];
            const troopsCount = cell.querySelector('.troops-count');
            
            // Reset classes
            cell.className = 'game-cell';
            
            if (territory.owner) {
                cell.classList.add(territory.owner);
                troopsCount.textContent = territory.troops;
            } else {
                troopsCount.textContent = '';
            }

            // Highlight selected territory and its adjacent territories
            if (state.selectedTerritory === i) {
                cell.classList.add('selected');
            } else if (state.selectedTerritory !== undefined && 
                      this.game.getAdjacentTerritories(state.selectedTerritory).includes(i)) {
                cell.classList.add('adjacent');
            }
        }
    }

    updatePhaseIndicators(state) {
        const phases = ['deploy', 'attack', 'fortify'];
        phases.forEach(phase => {
            const button = document.querySelector(`[data-phase="${phase}"]`);
            button.classList.toggle('active', phase === state.currentPhase);
        });
    }

    updatePlayerInfo() {
        const currentPlayerColor = this.network.isHost ? 'Blue' : 'Red';
        const opponentColor = this.network.isHost ? 'Red' : 'Blue';
        
        document.querySelector('.player-symbol').textContent = currentPlayerColor;
        document.querySelector('.opponent-symbol').textContent = opponentColor;
    }

    setupUIHandlers() {
        document.getElementById('save-name').addEventListener('click', () => {
            const name = this.playerNameInput.value.trim();
            if (name) {
                this.network.setPlayerName(name);
                localStorage.setItem('playerName', name);
                // Visual feedback
                const saveButton = document.getElementById('save-name');
                const originalText = saveButton.textContent;
                saveButton.textContent = 'Saved!';
                saveButton.disabled = true;
                setTimeout(() => {
                    saveButton.textContent = originalText;
                    saveButton.disabled = false;
                }, 2000);
            }
        });

        this.playerNameInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                document.getElementById('save-name').click();
            }
        });

        // Load saved player name if exists
        const savedName = localStorage.getItem('playerName');
        if (savedName) {
            this.playerNameInput.value = savedName;
            this.network.setPlayerName(savedName);
        }

        document.getElementById('create-room').addEventListener('click', async () => {
            const createRoomButton = document.getElementById('create-room');
            createRoomButton.disabled = true;
            try {
                const roomCode = await this.network.initializeHost();
                if (roomCode) {
                    this.statusElement.textContent = 'Room created successfully';
                }
            } catch (error) {
                console.error('Failed to create room:', error);
                this.statusElement.textContent = 'Failed to create room';
            } finally {
                createRoomButton.disabled = false;
            }
        });

        const joinRoom = async () => {
            const roomCode = this.roomCodeInput.value.trim().toUpperCase();
            if (roomCode) {
                const joinButton = document.getElementById('join-room');
                joinButton.disabled = true;
                try {
                    await this.network.joinRoom(roomCode);
                    this.roomCodeInput.value = '';
                    this.statusElement.textContent = 'Joined room successfully';
                } catch (error) {
                    console.error('Failed to join room:', error);
                    this.statusElement.textContent = 'Failed to join room';
                } finally {
                    joinButton.disabled = false;
                }
            }
        };

        document.getElementById('join-room').addEventListener('click', joinRoom);

        this.roomCodeInput.addEventListener('keypress', async (event) => {
            if (event.key === 'Enter') {
                joinRoom();
            }
        });

        this.roomCodeContainer.addEventListener('click', () => {
            const roomCode = this.roomCodeElement.textContent;
            if (roomCode) {
                navigator.clipboard.writeText(roomCode)
                    .then(() => {
                        this.copyFeedback.classList.add('show');
                        setTimeout(() => {
                            this.copyFeedback.classList.remove('show');
                        }, 2000);
                    })
                    .catch(err => console.error('Failed to copy room code:', err));
            }
        });

        this.leaveRoomButton.addEventListener('click', async () => {
            const disconnected = await this.network.disconnect();
            if (disconnected) {
                window.location.reload();
            }
        });

        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        this.messageInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    async attemptReconnect(roomCode) {
        try {
            await this.network.attemptReconnect(roomCode);
        } catch (error) {
            console.error('Failed to reconnect:', error);
            sessionStorage.removeItem('roomCode');
        }
    }

    sendMessage() {
        const message = this.messageInput.value.trim();
        if (message) {
            this.network.sendMessage(message);
            this.displayMessage(message, 'sent');
            this.messageInput.value = '';
        }
    }

    displayMessage(message, type) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        
        if (typeof message === 'object' && message.text) {
            const senderName = type === 'sent' ? (this.playerNameInput.value.trim() || 'You') : (message.sender || 'Anonymous');
            messageElement.innerHTML = `<strong>${senderName}:</strong> ${message.text}`;
        } else {
            // Handle legacy messages or direct text
            const senderName = type === 'sent' ? (this.playerNameInput.value.trim() || 'You') : 'Anonymous';
            messageElement.innerHTML = `<strong>${senderName}:</strong> ${message}`;
        }
        
        this.messagesContainer.appendChild(messageElement);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

// Initialize the chat application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});