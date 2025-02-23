import { Peer } from 'https://cdn.skypack.dev/peerjs@1.4.7';

export class Network {
    constructor() {
        this.peers = new Map();
        this.localId = this.generateId();
        this.onMessageReceived = null;
        this.onPeerJoin = null;
        this.onPeerLeave = null;
        this.onStatusUpdate = null;
        this.peer = null;
        this.isHost = false;
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    async initializeHost() {
        const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
        
        this.peer = new Peer(roomCode);
        this.isHost = true;

        if (this.onStatusUpdate) {
            this.onStatusUpdate(`Room Code: ${roomCode}`);
        }

        this.peer.on('connection', (connection) => {
            connection.on('open', () => {
                this.peers.set(connection.peer, connection);
                
                if (this.onPeerJoin) {
                    this.onPeerJoin(connection.peer);
                }
                if (this.onStatusUpdate) {
                    this.onStatusUpdate(`Connected with: ${connection.peer}`);
                }
            });

            connection.on('data', (data) => {
                if (this.onMessageReceived) {
                    this.onMessageReceived(connection.peer, data);
                }
            });

            connection.on('close', () => {
                this.peers.delete(connection.peer);
                if (this.onPeerLeave) {
                    this.onPeerLeave(connection.peer);
                }
                if (this.onStatusUpdate) {
                    this.onStatusUpdate(`Peer disconnected: ${connection.peer}`);
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
                    
                    if (this.onPeerJoin) {
                        this.onPeerJoin(roomCode);
                    }
                    if (this.onStatusUpdate) {
                        this.onStatusUpdate(`Connected to room: ${roomCode}`);
                    }
                    resolve();
                });

                connection.on('error', reject);
            });

            connection.on('data', (data) => {
                if (this.onMessageReceived) {
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

    sendMessage(message) {
        this.peers.forEach(connection => {
            if (connection.open) {
                connection.send(message);
            }
        });
    }

    disconnect() {
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
    }
}
