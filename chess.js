// Chess piece Unicode symbols
const PIECES = {
  WHITE: {
    KING: '♔',
    QUEEN: '♕',
    ROOK: '♖',
    BISHOP: '♗',
    KNIGHT: '♘',
    PAWN: '♙'
  },
  BLACK: {
    KING: '♚',
    QUEEN: '♛',
    ROOK: '♜',
    BISHOP: '♝',
    KNIGHT: '♞',
    PAWN: '♟'
  }
};

class ChessGame {
  constructor() {
    this.board = this.createInitialBoard();
    this.currentPlayer = 'WHITE';
    this.selectedPiece = null;
    this.chessboardElement = document.getElementById('chessboard');
    this.turnIndicator = document.getElementById('turn-indicator');
    this.statusMessage = document.getElementById('status-message');
    this.resetButton = document.getElementById('reset-btn');
    this.possibleMoves = [];
    this.inCheck = false;
    this.gameOver = false;
    
    this.initBoard();
    this.setupEventListeners();
  }

  createInitialBoard() {
    const board = Array(8).fill().map(() => Array(8).fill(null));
    
    // Place pawns
    for (let i = 0; i < 8; i++) {
      board[1][i] = { type: 'PAWN', color: 'BLACK' };
      board[6][i] = { type: 'PAWN', color: 'WHITE' };
    }
    
    // Place other pieces
    const backRankOrder = ['ROOK', 'KNIGHT', 'BISHOP', 'QUEEN', 'KING', 'BISHOP', 'KNIGHT', 'ROOK'];
    
    for (let i = 0; i < 8; i++) {
      board[0][i] = { type: backRankOrder[i], color: 'BLACK' };
      board[7][i] = { type: backRankOrder[i], color: 'WHITE' };
    }
    
    return board;
  }

  initBoard() {
    this.chessboardElement.innerHTML = '';
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement('div');
        square.classList.add('square');
        square.classList.add((row + col) % 2 === 0 ? 'white' : 'black');
        square.dataset.row = row;
        square.dataset.col = col;
        
        const piece = this.board[row][col];
        if (piece) {
          square.textContent = PIECES[piece.color][piece.type];
        }
        
        this.chessboardElement.appendChild(square);
      }
    }
  }

  setupEventListeners() {
    this.chessboardElement.addEventListener('click', (e) => {
      if (this.gameOver) return;
      
      const square = e.target.closest('.square');
      if (!square) return;
      
      const row = parseInt(square.dataset.row);
      const col = parseInt(square.dataset.col);
      
      this.handleSquareClick(row, col);
    });
    
    this.resetButton.addEventListener('click', () => this.resetGame());
  }

  handleSquareClick(row, col) {
    const piece = this.board[row][col];
    
    // Clear previous selection styling
    this.clearHighlights();
    
    // If we already have a piece selected
    if (this.selectedPiece) {
      const startRow = this.selectedPiece.row;
      const startCol = this.selectedPiece.col;
      
      // Check if the clicked square is in the possible moves
      const moveIndex = this.possibleMoves.findIndex(
        move => move.row === row && move.col === col
      );
      
      if (moveIndex !== -1) {
        // Make the move
        this.makeMove(startRow, startCol, row, col);
        this.selectedPiece = null;
        this.possibleMoves = [];
        return;
      }
      
      // If clicked on another piece of the current player, select it instead
      if (piece && piece.color === this.currentPlayer) {
        this.selectPiece(row, col);
        return;
      }
      
      // Otherwise, deselect the current piece
      this.selectedPiece = null;
      this.possibleMoves = [];
      
    } else if (piece && piece.color === this.currentPlayer) {
      // Select the piece if it belongs to the current player
      this.selectPiece(row, col);
    }
  }

  selectPiece(row, col) {
    this.selectedPiece = {
      row,
      col,
      ...this.board[row][col]
    };
    
    // Highlight the selected square
    const selectedSquare = this.getSquareElement(row, col);
    selectedSquare.classList.add('selected');
    
    // Calculate and highlight possible moves
    this.possibleMoves = this.calculatePossibleMoves(row, col);
    this.highlightPossibleMoves();
  }

  calculatePossibleMoves(row, col) {
    const piece = this.board[row][col];
    if (!piece) return [];
    
    const moves = [];
    const { color, type } = piece;
    
    switch (type) {
      case 'PAWN':
        this.calculatePawnMoves(row, col, color, moves);
        break;
      case 'ROOK':
        this.calculateRookMoves(row, col, color, moves);
        break;
      case 'KNIGHT':
        this.calculateKnightMoves(row, col, color, moves);
        break;
      case 'BISHOP':
        this.calculateBishopMoves(row, col, color, moves);
        break;
      case 'QUEEN':
        this.calculateRookMoves(row, col, color, moves);
        this.calculateBishopMoves(row, col, color, moves);
        break;
      case 'KING':
        this.calculateKingMoves(row, col, color, moves);
        break;
    }
    
    // Filter moves that would leave the king in check
    return this.filterLegalMoves(row, col, moves);
  }

  filterLegalMoves(startRow, startCol, moves) {
    const legalMoves = [];
    const originalPiece = this.board[startRow][startCol];
    
    for (const move of moves) {
      const targetPiece = this.board[move.row][move.col];
      
      // Temporarily make the move
      this.board[move.row][move.col] = originalPiece;
      this.board[startRow][startCol] = null;
      
      // Check if the king is in check after this move
      const isInCheck = this.isKingInCheck(this.currentPlayer);
      
      // Undo the move
      this.board[startRow][startCol] = originalPiece;
      this.board[move.row][move.col] = targetPiece;
      
      // If the move doesn't leave the king in check, it's legal
      if (!isInCheck) {
        legalMoves.push(move);
      }
    }
    
    return legalMoves;
  }

  isKingInCheck(kingColor) {
    // Find the king's position
    let kingRow = -1, kingCol = -1;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.type === 'KING' && piece.color === kingColor) {
          kingRow = row;
          kingCol = col;
          break;
        }
      }
      if (kingRow !== -1) break;
    }
    
    // Check if any opponent piece can capture the king
    const opponentColor = kingColor === 'WHITE' ? 'BLACK' : 'WHITE';
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.color === opponentColor) {
          const moves = [];
          
          switch (piece.type) {
            case 'PAWN':
              this.calculatePawnAttacks(row, col, opponentColor, moves);
              break;
            case 'ROOK':
              this.calculateRookMoves(row, col, opponentColor, moves, true);
              break;
            case 'KNIGHT':
              this.calculateKnightMoves(row, col, opponentColor, moves, true);
              break;
            case 'BISHOP':
              this.calculateBishopMoves(row, col, opponentColor, moves, true);
              break;
            case 'QUEEN':
              this.calculateRookMoves(row, col, opponentColor, moves, true);
              this.calculateBishopMoves(row, col, opponentColor, moves, true);
              break;
            case 'KING':
              this.calculateKingMoves(row, col, opponentColor, moves, true);
              break;
          }
          
          // Check if any of these moves can capture the king
          for (const move of moves) {
            if (move.row === kingRow && move.col === kingCol) {
              return true;
            }
          }
        }
      }
    }
    
    return false;
  }

  calculatePawnMoves(row, col, color, moves) {
    const direction = color === 'WHITE' ? -1 : 1;
    const startingRow = color === 'WHITE' ? 6 : 1;
    
    // Move forward one square
    if (this.isInBounds(row + direction, col) && !this.board[row + direction][col]) {
      moves.push({ row: row + direction, col });
      
      // Move forward two squares from the starting position
      if (row === startingRow && !this.board[row + 2 * direction][col]) {
        moves.push({ row: row + 2 * direction, col });
      }
    }
    
    // Capture diagonally
    this.calculatePawnAttacks(row, col, color, moves);
  }
  
  calculatePawnAttacks(row, col, color, moves) {
    const direction = color === 'WHITE' ? -1 : 1;
    
    // Capture diagonally
    for (const colOffset of [-1, 1]) {
      const newRow = row + direction;
      const newCol = col + colOffset;
      
      if (this.isInBounds(newRow, newCol)) {
        const target = this.board[newRow][newCol];
        if (target && target.color !== color) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    }
  }

  calculateRookMoves(row, col, color, moves, checkOnly = false) {
    const directions = [
      { rowOffset: -1, colOffset: 0 }, // Up
      { rowOffset: 1, colOffset: 0 },  // Down
      { rowOffset: 0, colOffset: -1 }, // Left
      { rowOffset: 0, colOffset: 1 }   // Right
    ];
    
    this.calculateLinearMoves(row, col, color, moves, directions, checkOnly);
  }

  calculateBishopMoves(row, col, color, moves, checkOnly = false) {
    const directions = [
      { rowOffset: -1, colOffset: -1 }, // Up-left
      { rowOffset: -1, colOffset: 1 },  // Up-right
      { rowOffset: 1, colOffset: -1 },  // Down-left
      { rowOffset: 1, colOffset: 1 }    // Down-right
    ];
    
    this.calculateLinearMoves(row, col, color, moves, directions, checkOnly);
  }

  calculateLinearMoves(row, col, color, moves, directions, checkOnly) {
    for (const { rowOffset, colOffset } of directions) {
      let newRow = row + rowOffset;
      let newCol = col + colOffset;
      
      while (this.isInBounds(newRow, newCol)) {
        const target = this.board[newRow][newCol];
        
        if (!target) {
          // Empty square
          moves.push({ row: newRow, col: newCol });
        } else {
          // Square has a piece
          if (target.color !== color) {
            // Can capture opponent's piece
            moves.push({ row: newRow, col: newCol });
          }
          break; // Stop in this direction after encountering any piece
        }
        
        newRow += rowOffset;
        newCol += colOffset;
      }
    }
  }

  calculateKnightMoves(row, col, color, moves, checkOnly = false) {
    const knightMoves = [
      { rowOffset: -2, colOffset: -1 },
      { rowOffset: -2, colOffset: 1 },
      { rowOffset: -1, colOffset: -2 },
      { rowOffset: -1, colOffset: 2 },
      { rowOffset: 1, colOffset: -2 },
      { rowOffset: 1, colOffset: 2 },
      { rowOffset: 2, colOffset: -1 },
      { rowOffset: 2, colOffset: 1 }
    ];
    
    for (const { rowOffset, colOffset } of knightMoves) {
      const newRow = row + rowOffset;
      const newCol = col + colOffset;
      
      if (this.isInBounds(newRow, newCol)) {
        const target = this.board[newRow][newCol];
        
        if (!target || target.color !== color) {
          // Empty square or can capture opponent's piece
          moves.push({ row: newRow, col: newCol });
        }
      }
    }
  }

  calculateKingMoves(row, col, color, moves, checkOnly = false) {
    const kingMoves = [
      { rowOffset: -1, colOffset: -1 },
      { rowOffset: -1, colOffset: 0 },
      { rowOffset: -1, colOffset: 1 },
      { rowOffset: 0, colOffset: -1 },
      { rowOffset: 0, colOffset: 1 },
      { rowOffset: 1, colOffset: -1 },
      { rowOffset: 1, colOffset: 0 },
      { rowOffset: 1, colOffset: 1 }
    ];
    
    for (const { rowOffset, colOffset } of kingMoves) {
      const newRow = row + rowOffset;
      const newCol = col + colOffset;
      
      if (this.isInBounds(newRow, newCol)) {
        const target = this.board[newRow][newCol];
        
        if (!target || target.color !== color) {
          // Empty square or can capture opponent's piece
          if (checkOnly) {
            moves.push({ row: newRow, col: newCol });
          } else {
            // For actual moves, we need to check that the king won't move into check
            const originalPiece = this.board[row][col];
            const targetPiece = this.board[newRow][newCol];
            
            // Temporarily make the move
            this.board[newRow][newCol] = originalPiece;
            this.board[row][col] = null;
            
            // Check if the king would be in check
            const wouldBeInCheck = this.isKingInCheck(color);
            
            // Undo the move
            this.board[row][col] = originalPiece;
            this.board[newRow][newCol] = targetPiece;
            
            // Only add the move if it doesn't put the king in check
            if (!wouldBeInCheck) {
              moves.push({ row: newRow, col: newCol });
            }
          }
        }
      }
    }
  }

  isInBounds(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  highlightPossibleMoves() {
    for (const move of this.possibleMoves) {
      const square = this.getSquareElement(move.row, move.col);
      
      if (this.board[move.row][move.col]) {
        // If there's a piece to capture
        square.classList.add('capturable');
      } else {
        // If it's an empty square
        square.classList.add('movable');
      }
    }
  }

  clearHighlights() {
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
      square.classList.remove('selected', 'movable', 'capturable');
    });
  }

  makeMove(startRow, startCol, endRow, endCol) {
    const movingPiece = this.board[startRow][startCol];
    const capturedPiece = this.board[endRow][endCol];
    
    // Update the board
    this.board[endRow][endCol] = movingPiece;
    this.board[startRow][startCol] = null;
    
    // Check for pawn promotion (reaching the end rank)
    if (movingPiece.type === 'PAWN') {
      if ((movingPiece.color === 'WHITE' && endRow === 0) || 
          (movingPiece.color === 'BLACK' && endRow === 7)) {
        // Promote to queen (could be expanded to offer choice)
        this.board[endRow][endCol] = { type: 'QUEEN', color: movingPiece.color };
      }
    }
    
    // Update the visual board
    this.updateBoardView();
    
    // Switch player
    this.currentPlayer = this.currentPlayer === 'WHITE' ? 'BLACK' : 'WHITE';
    this.turnIndicator.textContent = `${this.currentPlayer.charAt(0) + this.currentPlayer.slice(1).toLowerCase()}'s turn`;
    
    // Check if the opponent is in check or checkmate
    this.checkGameState();
  }

  checkGameState() {
    // Check if the current player is in check
    this.inCheck = this.isKingInCheck(this.currentPlayer);
    
    if (this.inCheck) {
      // Check if it's checkmate
      if (this.isCheckmate()) {
        const winner = this.currentPlayer === 'WHITE' ? 'BLACK' : 'WHITE';
        this.statusMessage.textContent = `Checkmate! ${winner.charAt(0) + winner.slice(1).toLowerCase()} wins!`;
        this.gameOver = true;
      } else {
        this.statusMessage.textContent = `${this.currentPlayer} is in check!`;
      }
    } else if (this.isStalemate()) {
      this.statusMessage.textContent = "Stalemate! The game is a draw.";
      this.gameOver = true;
    } else {
      this.statusMessage.textContent = "";
    }
  }

  isCheckmate() {
    // If not in check, it can't be checkmate
    if (!this.inCheck) return false;
    
    // Check if any move can get the king out of check
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.color === this.currentPlayer) {
          const moves = this.calculatePossibleMoves(row, col);
          if (moves.length > 0) {
            return false; // Found at least one legal move
          }
        }
      }
    }
    
    return true; // No legal moves and in check -> checkmate
  }

  isStalemate() {
    // If in check, it's not stalemate
    if (this.inCheck) return false;
    
    // Check if any move is possible
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.color === this.currentPlayer) {
          const moves = this.calculatePossibleMoves(row, col);
          if (moves.length > 0) {
            return false; // Found at least one legal move
          }
        }
      }
    }
    
    return true; // No legal moves and not in check -> stalemate
  }

  updateBoardView() {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = this.getSquareElement(row, col);
        const piece = this.board[row][col];
        
        square.textContent = piece ? PIECES[piece.color][piece.type] : '';
      }
    }
  }

  getSquareElement(row, col) {
    return document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
  }

  resetGame() {
    this.board = this.createInitialBoard();
    this.currentPlayer = 'WHITE';
    this.selectedPiece = null;
    this.possibleMoves = [];
    this.inCheck = false;
    this.gameOver = false;
    this.turnIndicator.textContent = "White's turn";
    this.statusMessage.textContent = "";
    this.clearHighlights();
    this.updateBoardView();
  }
}

// Start the game
document.addEventListener('DOMContentLoaded', () => {
  new ChessGame();
});

