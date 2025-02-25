import { Network } from './game/Network.js';
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
        this.gameStatus = document.querySelector('.game-status');
        this.resetGameButton = document.getElementById('reset-game');
        this.roomControls = document.querySelector('.room-actions');
        this.angleSlider = document.getElementById('angle-slider');
        this.powerSlider = document.getElementById('power-slider');
        this.angleValue = document.getElementById('angle-value');
        this.powerValue = document.getElementById('power-value');
        this.throwButton = document.getElementById('throw-button');
        this.forwardButton = document.getElementById('forward-button');
        this.backwardButton = document.getElementById('backward-button');
        this.leftButton = document.getElementById('left-button');
        this.rightButton = document.getElementById('right-button');
        this.rotateLeftButton = document.getElementById('rotate-left-button');
        this.rotateRightButton = document.getElementById('rotate-right-button');

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
        if (!this.gameStatus) throw new Error('Game status element not found');
        if (!this.resetGameButton) throw new Error('Reset game button element not found');
        if (!this.roomControls) throw new Error('Room controls element not found');
        if (!this.angleSlider) throw new Error('Angle slider element not found');
        if (!this.powerSlider) throw new Error('Power slider element not found');
        if (!this.angleValue) throw new Error('Angle value element not found');
        if (!this.powerValue) throw new Error('Power value element not found');
        if (!this.throwButton) throw new Error('Throw button element not found');
        if (!this.forwardButton) throw new Error('Forward button element not found');
        if (!this.backwardButton) throw new Error('Backward button element not found');
        if (!this.leftButton) throw new Error('Left button element not found');
        if (!this.rightButton) throw new Error('Right button element not found');
        if (!this.rotateLeftButton) throw new Error('Rotate left button element not found');
        if (!this.rotateRightButton) throw new Error('Rotate right button element not found');

        // Initialize game and network
        this.game = new Game();
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
            this.throwButton.disabled = false;
            this.gameStatus.textContent = "Game started! Your turn";
            this.isMyTurn = this.network.isHost;
            this.updatePlayerInfo();
            
            // Update game status based on whose turn it is
            if (this.isMyTurn) {
                this.gameStatus.textContent = "Your turn! Move, aim, and shoot";
            } else {
                this.gameStatus.textContent = "Opponent's turn. Wait for them to shoot";
            }
        };

        this.network.onPeerLeave = () => {
            this.messageInput.disabled = true;
            this.sendButton.disabled = true;
            this.throwButton.disabled = true;
            this.gameStatus.textContent = "Waiting for opponent...";
            this.resetGameButton.style.display = 'none';
            this.game.reset();
            
            // Reset opponent info
            document.querySelector('.opponent-name').textContent = 'Waiting for opponent...';
            document.querySelector('.opponent-symbol').textContent = '';
            document.querySelector('.opponent-player').classList.remove('active');
            document.querySelector('.current-player').classList.remove('active');
        };

        this.network.onGameReset = () => {
            this.game.reset();
            this.isMyTurn = !this.network.isHost; // Other player who reset goes first
            this.resetGameButton.style.display = 'none';
            
            // Update game status based on whose turn it is
            if (this.isMyTurn) {
                this.gameStatus.textContent = "Your turn! Move, aim, and shoot";
            } else {
                this.gameStatus.textContent = "Opponent's turn. Wait for them to shoot";
            }
        };
        
        this.network.onGameMove = (angle, power) => {
            this.game.shootBullet(angle, power);
            this.isMyTurn = true;
        };
    }

    setupGameHandlers() {
        this.game.onGameUpdate = (state) => {
            if (state.winner !== undefined) {
                const winnerText = state.winner === 0 ? 
                    (this.network.isHost ? "You win!" : "Opponent wins!") : 
                    (this.network.isHost ? "Opponent wins!" : "You win!");
                
                if (state.gameOver) {
                    this.gameStatus.textContent = `Game over! ${winnerText}`;
                    this.resetGameButton.style.display = 'block';
                } else {
                    // Update turn status
                    const isMyTurn = (state.currentPlayer === 0 && this.network.isHost) || 
                                    (state.currentPlayer === 1 && !this.network.isHost);
                    
                    if (isMyTurn) {
                        this.gameStatus.textContent = "Your turn! Move, aim, and shoot";
                    } else {
                        this.gameStatus.textContent = "Opponent's turn. Wait for them to shoot";
                    }
                }
            }
            
            // Update active player indicators
            const isPlayer1Turn = state.currentPlayer === 0;
            const currentPlayerIsPlayer1 = this.network.isHost;
            document.querySelector('.current-player').classList.toggle('active', 
                (isPlayer1Turn && currentPlayerIsPlayer1) || (!isPlayer1Turn && !currentPlayerIsPlayer1));
            document.querySelector('.opponent-player').classList.toggle('active',
                (isPlayer1Turn && !currentPlayerIsPlayer1) || (!isPlayer1Turn && currentPlayerIsPlayer1));
        };

        // Movement and rotation controls
        this.forwardButton.addEventListener('click', () => {
            if (this.isMyTurn) {
                this.game.movePlayer('forward');
            }
        });
        
        this.backwardButton.addEventListener('click', () => {
            if (this.isMyTurn) {
                this.game.movePlayer('backward');
            }
        });
        
        this.leftButton.addEventListener('click', () => {
            if (this.isMyTurn) {
                this.game.movePlayer('left');
            }
        });
        
        this.rightButton.addEventListener('click', () => {
            if (this.isMyTurn) {
                this.game.movePlayer('right');
            }
        });
        
        this.rotateLeftButton.addEventListener('click', () => {
            if (this.isMyTurn) {
                this.game.rotatePlayer(-15); // Rotate 15 degrees left
            }
        });
        
        this.rotateRightButton.addEventListener('click', () => {
            if (this.isMyTurn) {
                this.game.rotatePlayer(15); // Rotate 15 degrees right
            }
        });
        
        this.throwButton.addEventListener('click', () => {
            if (!this.isMyTurn) {
                this.gameStatus.textContent = "Wait for your turn!";
                return;
            }

            const angle = parseInt(this.angleSlider.value);
            const power = parseInt(this.powerSlider.value);
            
            if (this.game.shootBullet(angle, power)) {
                this.network.sendGameMove(angle, power);
                this.isMyTurn = false;
            }
        });

        this.resetGameButton.addEventListener('click', () => {
            this.game.reset();
            this.isMyTurn = this.network.isHost;
            this.resetGameButton.style.display = 'none';
            
            // Update game status based on whose turn it is
            if (this.isMyTurn) {
                this.gameStatus.textContent = "Your turn! Move, aim, and shoot";
            } else {
                this.gameStatus.textContent = "Opponent's turn. Wait for them to shoot";
            }
            
            // Send game reset event to the other player
            this.network.sendGameReset();
        });
    }

    updatePlayerInfo() {
        const currentPlayerSymbol = this.network.isHost ? 'Player 1' : 'Player 2';
        const opponentSymbol = this.network.isHost ? 'Player 2' : 'Player 1';
        
        document.querySelector('.player-symbol').textContent = currentPlayerSymbol;
        document.querySelector('.opponent-symbol').textContent = opponentSymbol;
        
        // Set initial active state
        const isPlayer1Turn = this.game.currentPlayer === 0;
        document.querySelector('.current-player').classList.toggle('active', 
            (isPlayer1Turn && this.network.isHost) || (!isPlayer1Turn && !this.network.isHost));
        document.querySelector('.opponent-player').classList.toggle('active',
            (isPlayer1Turn && !this.network.isHost) || (!isPlayer1Turn && this.network.isHost));
    }

    setupUIHandlers() {
        // Slider handlers
        this.angleSlider.addEventListener('input', () => {
            this.angleValue.textContent = `${this.angleSlider.value}°`;
        });
        
        this.powerSlider.addEventListener('input', () => {
            this.powerValue.textContent = this.powerSlider.value;
        });
        
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
