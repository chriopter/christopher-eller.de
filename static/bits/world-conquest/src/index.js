import { Network } from './game/Network.js';

class ChatApp {
    constructor() {
        this.network = new Network();
        this.setupNetworkHandlers();
        this.setupUIHandlers();
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.messagesContainer = document.getElementById('messages');
        this.statusElement = document.getElementById('connection-status');
    }

    setupNetworkHandlers() {
        this.network.onMessageReceived = (peerId, message) => {
            this.displayMessage(message, 'received');
        };

        this.network.onStatusUpdate = (status) => {
            this.statusElement.textContent = status;
        };

        this.network.onPeerJoin = () => {
            this.messageInput.disabled = false;
            this.sendButton.disabled = false;
        };

        this.network.onPeerLeave = () => {
            this.messageInput.disabled = true;
            this.sendButton.disabled = true;
        };
    }

    setupUIHandlers() {
        document.getElementById('create-room').addEventListener('click', async () => {
            try {
                await this.network.initializeHost();
            } catch (error) {
                console.error('Failed to create room:', error);
                this.statusElement.textContent = 'Failed to create room';
            }
        });

        document.getElementById('join-room').addEventListener('click', async () => {
            const roomCode = prompt('Enter room code:');
            if (roomCode) {
                try {
                    await this.network.joinRoom(roomCode);
                } catch (error) {
                    console.error('Failed to join room:', error);
                    this.statusElement.textContent = 'Failed to join room';
                }
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
        messageElement.textContent = message;
        this.messagesContainer.appendChild(messageElement);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

// Initialize the chat application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});
