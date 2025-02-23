export class Network {
    constructor() {
        this.peers = new Map();
        this.localId = this.generateId();
        this.onPlayerJoin = null;
        this.onPlayerLeave = null;
        this.onGameStateUpdate = null;
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    async initializeHost() {
        // Generate room code for others to join
        const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
        console.log('Room Code:', roomCode);
        
        // Display room code in UI
        document.getElementById('player-status').innerHTML = `
            Room Code: ${roomCode}<br>
            Waiting for players to join...
        `;
        
        return roomCode;
    }

    async joinGame(roomCode) {
        try {
            // Initialize WebRTC connection
            const peer = new SimplePeer({
                initiator: true,
                trickle: false
            });

            // Handle connection events
            peer.on('signal', data => {
                // In a real implementation, this would be sent to the host
                console.log('Signal data to send to host:', data);
            });

            peer.on('connect', () => {
                console.log('Connected to host');
                this.peers.set(peer._id, peer);
                
                if (this.onPlayerJoin) {
                    this.onPlayerJoin({
                        id: peer._id,
                        isHost: false
                    });
                }
            });

            peer.on('data', data => {
                const message = JSON.parse(data);
                this.handleMessage(message, peer._id);
            });

            peer.on('close', () => {
                this.peers.delete(peer._id);
                if (this.onPlayerLeave) {
                    this.onPlayerLeave(peer._id);
                }
            });

            return peer;
        } catch (error) {
            console.error('Failed to join game:', error);
            throw error;
        }
    }

    handleMessage(message, peerId) {
        switch (message.type) {
            case 'gameState':
                if (this.onGameStateUpdate) {
                    this.onGameStateUpdate(message.data);
                }
                break;
            case 'action':
                // Handle player actions
                this.broadcastToOthers({
                    type: 'action',
                    data: message.data
                }, peerId);
                break;
            default:
                console.warn('Unknown message type:', message.type);
        }
    }

    broadcastToAll(message) {
        const data = JSON.stringify(message);
        this.peers.forEach(peer => {
            if (peer.connected) {
                peer.send(data);
            }
        });
    }

    broadcastToOthers(message, excludePeerId) {
        const data = JSON.stringify(message);
        this.peers.forEach((peer, id) => {
            if (id !== excludePeerId && peer.connected) {
                peer.send(data);
            }
        });
    }

    sendToPeer(peerId, message) {
        const peer = this.peers.get(peerId);
        if (peer && peer.connected) {
            peer.send(JSON.stringify(message));
        }
    }

    disconnect() {
        this.peers.forEach(peer => {
            peer.destroy();
        });
        this.peers.clear();
    }
}
