import { Peer } from 'https://cdn.skypack.dev/peerjs@1.4.7';

export class Network {
    constructor() {
        this.peers = new Map();
        this.localId = this.generateId();
        this.onMessageReceived = null;
        this.onPeerJoin = null;
        this.onPeerLeave = null;
        this.onStatusUpdate = null;
        this.onGameMove = null;
        this.onGameReset = null;
        this.peer = null;
        this.isHost = false;
        this.playerName = '';
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    async initializeHost() {
        try {
            const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
            
            this.peer = new Peer(roomCode);
            this.isHost = true;

            // Wait for peer connection to be established
            await new Promise((resolve, reject) => {
                this.peer.on('open', () => {
                    if (this.onStatusUpdate) {
                        this.onStatusUpdate('Room created');
                    }
                    resolve();
                });
                this.peer.on('error', reject);
            });

            this.peer.on('connection', (connection) => {
                connection.on('open', () => {
                    this.peers.set(connection.peer, connection);
                    
                    // Send player name to the new peer
                    connection.send({
                        type: 'player_info',
                        name: this.playerName || 'Anonymous'
                    });
                    
                    if (this.onPeerJoin) {
                        this.onPeerJoin(connection.peer);
                    }
                    if (this.onStatusUpdate) {
                        this.onStatusUpdate('Connected');
                    }
                });

                connection.on('data', (data) => {
                    if (data.type === 'game_move' && this.onGameMove) {
                        this.onGameMove(data.angle, data.power);
                    } else if (data.type === 'game_reset' && this.onGameReset) {
                        this.onGameReset();
                    } else if (data.type === 'player_info') {
                        // Update opponent's name in the UI
                        const opponentNameElement = document.querySelector('.opponent-name');
                        if (opponentNameElement) {
                            opponentNameElement.textContent = data.name;
                        }
                    } else if (this.onMessageReceived) {
                        this.onMessageReceived(connection.peer, data);
                    }
                });

                connection.on('close', () => {
                    this.peers.delete(connection.peer);
                    if (this.onPeerLeave) {
                        this.onPeerLeave(connection.peer);
                    }
                    if (this.onStatusUpdate) {
                        this.onStatusUpdate('Peer disconnected');
                    }
                });
            });

            this.peer.on('error', (error) => {
                console.error('PeerJS error:', error);
                if (this.onStatusUpdate) {
                    this.onStatusUpdate(`Error: ${error.message}`);
                }
            });
            
            return roomCode;
        } catch (error) {
            console.error('Failed to initialize host:', error);
            if (this.onStatusUpdate) {
                this.onStatusUpdate(`Failed to create room: ${error.message}`);
            }
            throw error;
        }
    }

    async joinRoom(roomCode) {
        try {
            this.peer = new Peer();
            this.isHost = false;

            await new Promise((resolve, reject) => {
                this.peer.on('open', resolve);
                this.peer.on('error', reject);
            });

            const connection = this.peer.connect(roomCode);
            
            await new Promise((resolve, reject) => {
            connection.on('open', () => {
                this.peers.set(roomCode, connection);
                
                // Send player name to host
                connection.send({
                    type: 'player_info',
                    name: this.playerName || 'Anonymous'
                });
                
                if (this.onPeerJoin) {
                    this.onPeerJoin(roomCode);
                }
                if (this.onStatusUpdate) {
                    this.onStatusUpdate('Connected');
                }
                resolve();
            });

                connection.on('error', reject);
            });

            connection.on('data', (data) => {
                if (data.type === 'game_move' && this.onGameMove) {
                    this.onGameMove(data.angle, data.power);
                } else if (data.type === 'game_reset' && this.onGameReset) {
                    this.onGameReset();
                } else if (data.type === 'player_info') {
                    // Update opponent's name in the UI
                    const opponentNameElement = document.querySelector('.opponent-name');
                    if (opponentNameElement) {
                        opponentNameElement.textContent = data.name;
                    }
                } else if (this.onMessageReceived) {
                    this.onMessageReceived(roomCode, data);
                }
            });

            connection.on('close', () => {
                this.peers.delete(roomCode);
                if (this.onPeerLeave) {
                    this.onPeerLeave(roomCode);
                }
                if (this.onStatusUpdate) {
                    this.onStatusUpdate('Disconnected from room');
                }
            });

            return connection;
        } catch (error) {
            console.error('Failed to join room:', error);
            if (this.onStatusUpdate) {
                this.onStatusUpdate(`Failed to join room: ${error.message}`);
            }
            throw error;
        }
    }

    setPlayerName(name) {
        this.playerName = name;
        // Send updated name to all connected peers
        const nameData = {
            type: 'player_info',
            name: name || 'Anonymous'
        };
        this.peers.forEach(connection => {
            if (connection.open) {
                connection.send(nameData);
            }
        });
    }

    sendMessage(message) {
        const messageData = {
            type: 'chat',
            text: message,
            sender: this.playerName || 'Anonymous'
        };
        this.peers.forEach(connection => {
            if (connection.open) {
                connection.send(messageData);
            }
        });
    }

    sendGameMove(angle, power) {
        const moveData = {
            type: 'game_move',
            angle: angle,
            power: power
        };
        this.peers.forEach(connection => {
            if (connection.open) {
                connection.send(moveData);
            }
        });
    }

    sendGameReset() {
        const resetData = {
            type: 'game_reset'
        };
        this.peers.forEach(connection => {
            if (connection.open) {
                connection.send(resetData);
            }
        });
    }

    async disconnect() {
        if (!this.peer) return false;

        if (this.peer) {
            this.peer.destroy();
        }
        this.peers.forEach(connection => {
            connection.close();
        });
        this.peers.clear();
        this.peer = null;
        this.isHost = false;
        if (this.onStatusUpdate) {
            this.onStatusUpdate('Disconnected');
        }

        // Clear stored room code
        sessionStorage.removeItem('roomCode');
        return true;
    }

    async attemptReconnect(roomCode) {
        try {
            await this.joinRoom(roomCode);
            return true;
        } catch (error) {
            console.error('Reconnection failed:', error);
            return false;
        }
    }

    getRoomCode() {
        if (!this.peer) return null;
        return this.isHost ? this.peer.id : Array.from(this.peers.keys())[0];
    }
}
