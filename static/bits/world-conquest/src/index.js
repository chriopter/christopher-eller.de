import { Network } from './game/Network.js';
import { TicTacToe } from './game/TicTacToe.js';

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
        this.copyCodeButton = document.getElementById('copy-code');
        this.leaveRoomButton = document.getElementById('leave-room');
        this.playerNameInput = document.getElementById('player-name');
        this.gameStatus = document.querySelector('.game-status');
        this.gameBoard = document.querySelector('.game-board');
        this.resetGameButton = document.getElementById('reset-game');

        // Validate required DOM elements
        if (!this.messageInput) throw new Error('Message input element not found');
        if (!this.sendButton) throw new Error('Send button element not found');
        if (!this.messagesContainer) throw new Error('Messages container element not found');
        if (!this.statusElement) throw new Error('Status element not found');
        if (!this.roomCodeDisplay) throw new Error('Room code display element not found');
        if (!this.roomCodeElement) throw new Error('Room code element not found');
        if (!this.roomCodeInput) throw new Error('Room code input element not found');
        if (!this.copyCodeButton) throw new Error('Copy code button element not found');
        if (!this.leaveRoomButton) throw new Error('Leave room button element not found');
        if (!this.playerNameInput) throw new Error('Player name input element not found');

        // Initialize game and network
        this.game = new TicTacToe();
        this.network = new Network();
        this.isMyTurn = false;
        
        this.setupNetworkHandlers();
        this.setupUIHandlers();
        this.setupGameHandlers();

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
            this.statusElement.textContent = status;
            const roomCode = this.network.getRoomCode();
            
            if (roomCode) {
                this.roomCodeDisplay.style.display = 'block';
                this.roomCodeElement.textContent = roomCode;
                this.leaveRoomButton.style.display = 'block';
                sessionStorage.setItem('roomCode', roomCode);
            } else {
                this.roomCodeDisplay.style.display = 'none';
                this.leaveRoomButton.style.display = 'none';
                sessionStorage.removeItem('roomCode');
            }
        };

        this.network.onPeerJoin = () => {
            this.messageInput.disabled = false;
            this.sendButton.disabled = false;
            this.gameStatus.textContent = "Game started! X's turn";
            this.isMyTurn = this.network.isHost;
            this.updateGameBoard();
        };

        this.network.onPeerLeave = () => {
            this.messageInput.disabled = true;
            this.sendButton.disabled = true;
            this.gameStatus.textContent = "Waiting for opponent...";
            this.resetGameButton.style.display = 'none';
            this.game.reset();
            this.updateGameBoard();
        };
    }

    setupGameHandlers() {
        this.game.onGameUpdate = (state) => {
            this.updateGameBoard();
            
            if (state.winner) {
                this.gameStatus.textContent = `${state.winner} wins!`;
                this.resetGameButton.style.display = 'block';
            } else if (state.isDraw) {
                this.gameStatus.textContent = "It's a draw!";
                this.resetGameButton.style.display = 'block';
            } else {
                this.gameStatus.textContent = `${state.currentPlayer}'s turn`;
            }
        };

        this.gameBoard.addEventListener('click', (event) => {
            const cell = event.target;
            if (!cell.classList.contains('game-cell')) return;
            
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

        this.resetGameButton.addEventListener('click', () => {
            this.game.reset();
            this.isMyTurn = this.network.isHost;
            this.resetGameButton.style.display = 'none';
            this.updateGameBoard();
        });

        this.network.onGameMove = (index) => {
            this.game.makeMove(index);
            this.isMyTurn = true;
        };
    }

    updateGameBoard() {
        const cells = this.gameBoard.children;
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const value = this.game.board[i];
            cell.textContent = value || '';
            cell.classList.toggle('disabled', !!value);
        }
    }

    setupUIHandlers() {
        this.playerNameInput.addEventListener('change', () => {
            const name = this.playerNameInput.value.trim();
            this.network.setPlayerName(name);
            localStorage.setItem('playerName', name);
        });

        // Load saved player name if exists
        const savedName = localStorage.getItem('playerName');
        if (savedName) {
            this.playerNameInput.value = savedName;
            this.network.setPlayerName(savedName);
        }

        document.getElementById('create-room').addEventListener('click', async () => {
            try {
                await this.network.initializeHost();
            } catch (error) {
                console.error('Failed to create room:', error);
                this.statusElement.textContent = 'Failed to create room';
            }
        });

        document.getElementById('join-room').addEventListener('click', async () => {
            const roomCode = this.roomCodeInput.value.trim().toUpperCase();
            if (roomCode) {
                try {
                    await this.network.joinRoom(roomCode);
                    this.roomCodeInput.value = '';
                } catch (error) {
                    console.error('Failed to join room:', error);
                    this.statusElement.textContent = 'Failed to join room';
                }
            }
        });

        this.roomCodeInput.addEventListener('keypress', async (event) => {
            if (event.key === 'Enter') {
                const roomCode = this.roomCodeInput.value.trim().toUpperCase();
                if (roomCode) {
                    try {
                        await this.network.joinRoom(roomCode);
                        this.roomCodeInput.value = '';
                    } catch (error) {
                        console.error('Failed to join room:', error);
                        this.statusElement.textContent = 'Failed to join room';
                    }
                }
            }
        });

        this.copyCodeButton.addEventListener('click', () => {
            const roomCode = this.roomCodeElement.textContent;
            if (roomCode) {
                navigator.clipboard.writeText(roomCode)
                    .then(() => {
                        this.copyCodeButton.textContent = 'Copied!';
                        setTimeout(() => {
                            this.copyCodeButton.textContent = 'Copy Code';
                        }, 2000);
                    })
                    .catch(err => console.error('Failed to copy room code:', err));
            }
        });

        this.leaveRoomButton.addEventListener('click', async () => {
            await this.network.disconnect();
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
