export class Game {
    constructor() {
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.winner = null;
        this.onGameUpdate = null;
    }

    makeMove(index) {
        if (this.winner || this.board[index] !== null) {
            return false;
        }

        this.board[index] = this.currentPlayer;
        this.checkWinner();
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';

        if (this.onGameUpdate) {
            this.onGameUpdate({
                board: this.board,
                currentPlayer: this.currentPlayer,
                winner: this.winner,
                isDraw: this.isDraw()
            });
        }

        return true;
    }

    checkWinner() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (this.board[a] && 
                this.board[a] === this.board[b] && 
                this.board[a] === this.board[c]) {
                this.winner = this.board[a];
                return;
            }
        }
    }

    isDraw() {
        return !this.winner && this.board.every(cell => cell !== null);
    }

    reset() {
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.winner = null;
        
        if (this.onGameUpdate) {
            this.onGameUpdate({
                board: this.board,
                currentPlayer: this.currentPlayer,
                winner: null,
                isDraw: false
            });
        }
    }
}
