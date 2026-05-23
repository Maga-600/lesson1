/**
 * CHESS ENGINE WITH SOLID PRINCIPLES
 * 
 * SRP (Single Responsibility): Each class has one job.
 * OCP (Open/Closed): Easy to add new pieces without changing existing code.
 * LSP (Liskov Substitution): All pieces inherit from Piece base class.
 * ISP (Interface Segregation): Not heavily used in JS, but methods are specific.
 * DIP (Dependency Inversion): High-level Game depends on abstractions.
 */

// --- 1. MODELS (OOП: Encapsulation & Abstraction) ---

class Piece {
    constructor(type, color) {
        this.type = type;
        this.color = color;
        this.symbol = this.getSymbol();
    }

    // POLYMORPHISM: Each piece defines its own logic
    isValidMove(fromRow, fromCol, toRow, toCol, board) {
        throw new Error("Method must be implemented");
    }

    getSymbol() {
        const symbols = {
            white: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
            black: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
        };
        return symbols[this.color][this.type];
    }
}

class Pawn extends Piece {
    constructor(color) { super('p', color); }
    
    isValidMove(fr, fc, tr, tc, board) {
        const direction = this.color === 'white' ? -1 : 1;
        const startRow = this.color === 'white' ? 6 : 1;
        
        // Move forward 1
        if (fc === tc && tr === fr + direction && !board[tr][tc]) return true;
        // Move forward 2
        if (fc === tc && fr === startRow && tr === fr + (direction * 2) && !board[tr][tc] && !board[fr + direction][fc]) return true;
        // Capture
        if (Math.abs(fc - tc) === 1 && tr === fr + direction && board[tr][tc]) return true;
        
        return false;
    }
}

class Rook extends Piece {
    constructor(color) { super('r', color); }
    isValidMove(fr, fc, tr, tc, board) {
        return (fr === tr || fc === tc); // Simplified for demo
    }
}

class Knight extends Piece {
    constructor(color) { super('n', color); }
    isValidMove(fr, fc, tr, tc, board) {
        const dRow = Math.abs(tr - fr);
        const dCol = Math.abs(tc - fc);
        return (dRow === 2 && dCol === 1) || (dRow === 1 && dCol === 2);
    }
}

class Bishop extends Piece {
    constructor(color) { super('b', color); }
    isValidMove(fr, fc, tr, tc, board) {
        return Math.abs(tr - fr) === Math.abs(tc - fc);
    }
}

class Queen extends Piece {
    constructor(color) { super('q', color); }
    isValidMove(fr, fc, tr, tc, board) {
        // Combine Rook and Bishop logic
        return (fr === tr || fc === tc) || (Math.abs(tr - fr) === Math.abs(tc - fc));
    }
}

class King extends Piece {
    constructor(color) { super('k', color); }
    isValidMove(fr, fc, tr, tc, board) {
        return Math.abs(tr - fr) <= 1 && Math.abs(tc - fc) <= 1;
    }
}

// --- 2. GAME LOGIC (SRP: Manages state and rules) ---

class ChessGame {
    constructor() {
        this.board = [];
        this.currentPlayer = 'white';
        this.history = [];
        this.initBoard();
    }

    initBoard() {
        // Create empty 8x8 board
        this.board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Setup Pieces (Factory Pattern concept)
        const setupRow = (row, color, types) => {
            types.forEach((type, col) => {
                let PieceClass;
                switch(type) {
                    case 'r': PieceClass = Rook; break;
                    case 'n': PieceClass = Knight; break;
                    case 'b': PieceClass = Bishop; break;
                    case 'q': PieceClass = Queen; break;
                    case 'k': PieceClass = King; break;
                    case 'p': PieceClass = Pawn; break;
                }
                this.board[row][col] = new PieceClass(color);
            });
        };

        const backRow = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
        const pawnRow = Array(8).fill('p');

        setupRow(0, 'black', backRow);
        setupRow(1, 'black', pawnRow);
        setupRow(6, 'white', pawnRow);
        setupRow(7, 'white', backRow);
    }

    movePiece(fr, fc, tr, tc) {
        const piece = this.board[fr][fc];
        if (!piece) return false;
        if (piece.color !== this.currentPlayer) return false;

        // Check validity using Polymorphism
        if (!piece.isValidMove(fr, fc, tr, tc, this.board)) return false;

        // Execute Move
        this.history.push({
            from: {r: fr, c: fc},
            to: {r: tr, c: tc},
            piece: piece,
            captured: this.board[tr][tc]
        });

        this.board[tr][tc] = piece;
        this.board[fr][fc] = null;
        
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        return true;
    }

    undo() {
        if (this.history.length === 0) return;
        const lastMove = this.history.pop();
        this.board[lastMove.from.r][lastMove.from.c] = lastMove.piece;
        this.board[lastMove.to.r][lastMove.to.c] = lastMove.captured;
        this.currentPlayer = lastMove.piece.color;
    }
}

// --- 3. UI CONTROLLER (DIP: Depends on ChessGame abstraction) ---

class GameUI {
    constructor(game) {
        this.game = game;
        this.selectedCell = null;
        this.renderBoard();
    }

    renderBoard() {
        const boardEl = document.getElementById('chess-board');
        boardEl.innerHTML = '';
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = document.createElement('div');
                const isWhite = (r + c) % 2 === 0;
                cell.className = `cell ${isWhite ? 'cell--white' : 'cell--black'}`;
                
                if (this.selectedCell && this.selectedCell.r === r && this.selectedCell.c === c) {
                    cell.classList.add('cell--selected');
                }

                const piece = this.game.board[r][c];
                if (piece) cell.textContent = piece.symbol;

                cell.onclick = () => this.handleCellClick(r, c);
                boardEl.appendChild(cell);
            }
        }
        this.updateStatus();
    }

    handleCellClick(r, c) {
        const piece = this.game.board[r][c];

        if (!this.selectedCell) {
            if (piece && piece.color === this.game.currentPlayer) {
                this.selectedCell = { r, c };
                this.renderBoard();
            }
        } else {
            // Try to move
            const success = this.game.movePiece(this.selectedCell.r, this.selectedCell.c, r, c);
            
            if (success) {
                this.selectedCell = null;
                this.renderBoard();
                this.addHistoryLog();
            } else {
                // If clicked on another own piece, select it instead
                if (piece && piece.color === this.game.currentPlayer) {
                    this.selectedCell = { r, c };
                    this.renderBoard();
                } else {
                    this.selectedCell = null;
                    this.renderBoard();
                }
            }
        }
    }

    updateStatus() {
        const w = document.getElementById('player-white');
        const b = document.getElementById('player-black');
        if (this.game.currentPlayer === 'white') {
            w.classList.add('player--active');
            b.classList.remove('player--active');
        } else {
            w.classList.remove('player--active');
            b.classList.add('player--active');
        }
    }

    addHistoryLog() {
        const list = document.getElementById('move-list');
        const lastMove = this.game.history[this.game.history.length - 1];
        const li = document.createElement('li');
        li.textContent = `${lastMove.piece.symbol} (${lastMove.from.c},${lastMove.from.r}) → (${lastMove.to.c},${lastMove.to.r})`;
        list.prepend(li);
    }
}

// --- 4. APP INITIALIZATION ---

const gameInstance = new ChessGame();
const uiInstance = new GameUI(gameInstance);

const gameApp = {
    startGame: () => {
        document.getElementById('home-page').classList.remove('page--active');
        document.getElementById('game-page').classList.add('page--active');
        uiInstance.renderBoard();
    },
    showHome: () => {
        document.getElementById('game-page').classList.remove('page--active');
        document.getElementById('home-page').classList.add('page--active');
    },
    undo: () => {
        gameInstance.undo();
        uiInstance.renderBoard();
        // Remove last log
        const list = document.getElementById('move-list');
        if(list.firstChild) list.removeChild(list.firstChild);
    },
    reset: () => {
        if(confirm('Restart game?')) {
            gameInstance.initBoard();
            uiInstance.selectedCell = null;
            document.getElementById('move-list').innerHTML = '';
            uiInstance.renderBoard();
        }
    }
};