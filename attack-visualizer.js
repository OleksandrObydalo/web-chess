class AttackVisualizer {
  constructor(chessGame) {
    this.chessGame = chessGame;
    this.active = false;
    this.attackingPieces = new Set();
    this.attackedPieces = new Set();
    
    this.showAttacksBtn = document.getElementById('show-attacks-btn');
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.showAttacksBtn.addEventListener('click', () => this.toggleAttackView());
  }

  toggleAttackView() {
    this.active = !this.active;
    
    if (this.active) {
      this.showAttacksBtn.classList.add('active');
      this.showAttacksBtn.textContent = "Hide Attacks";
      this.visualizeAttacks();
      this.addLegend();
    } else {
      this.showAttacksBtn.classList.remove('active');
      this.showAttacksBtn.textContent = "Show Attacks";
      this.clearAttackHighlights();
      this.removeLegend();
    }
  }

  visualizeAttacks() {
    this.clearAttackHighlights();
    this.attackingPieces.clear();
    this.attackedPieces.clear();
    
    // Find attacking and attacked pieces for both colors
    this.findAttackingAndAttackedPieces();
    
    // Highlight the pieces
    this.highlightPieces();
  }

  findAttackingAndAttackedPieces() {
    // For each piece, determine if it's attacking any other piece
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.chessGame.board[row][col];
        if (!piece) continue;
        
        const attackedPositions = this.getPieceAttacks(row, col, piece);
        
        // If this piece is attacking any other piece, mark it as an attacker
        let isAttacking = false;
        for (const pos of attackedPositions) {
          const targetPiece = this.chessGame.board[pos.row][pos.col];
          if (targetPiece && targetPiece.color !== piece.color) {
            isAttacking = true;
            // Mark the target as being attacked
            this.attackedPieces.add(`${pos.row},${pos.col}`);
          }
        }
        
        if (isAttacking) {
          this.attackingPieces.add(`${row},${col}`);
        }
      }
    }
  }

  getPieceAttacks(row, col, piece) {
    const moves = [];
    const { color, type } = piece;
    
    switch (type) {
      case 'PAWN':
        this.chessGame.calculatePawnAttacks(row, col, color, moves);
        break;
      case 'ROOK':
        this.chessGame.calculateRookMoves(row, col, color, moves, true);
        break;
      case 'KNIGHT':
        this.chessGame.calculateKnightMoves(row, col, color, moves, true);
        break;
      case 'BISHOP':
        this.chessGame.calculateBishopMoves(row, col, color, moves, true);
        break;
      case 'QUEEN':
        this.chessGame.calculateRookMoves(row, col, color, moves, true);
        this.chessGame.calculateBishopMoves(row, col, color, moves, true);
        break;
      case 'KING':
        this.chessGame.calculateKingMoves(row, col, color, moves, true);
        break;
    }
    
    return moves;
  }

  highlightPieces() {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (!this.chessGame.board[row][col]) continue;
        
        const squareKey = `${row},${col}`;
        const isAttacking = this.attackingPieces.has(squareKey);
        const isAttacked = this.attackedPieces.has(squareKey);
        
        const square = this.chessGame.getSquareElement(row, col);
        
        if (isAttacking && isAttacked) {
          square.classList.add('both-statuses');
        } else if (isAttacking) {
          square.classList.add('attacking');
        } else if (isAttacked) {
          square.classList.add('attacked');
        }
      }
    }
  }

  clearAttackHighlights() {
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
      square.classList.remove('attacking', 'attacked', 'both-statuses');
    });
  }

  addLegend() {
    // Remove existing legend if any
    this.removeLegend();
    
    // Create legend container
    const legend = document.createElement('div');
    legend.classList.add('attack-legend');
    legend.id = 'attack-legend';
    
    // Add legend items
    const items = [
      { class: 'color-attacking', text: 'Attacking' },
      { class: 'color-attacked', text: 'Under Attack' },
      { class: 'color-both', text: 'Both Attacking & Under Attack' }
    ];
    
    items.forEach(item => {
      const legendItem = document.createElement('div');
      legendItem.classList.add('legend-item');
      
      const colorBox = document.createElement('div');
      colorBox.classList.add('legend-color', item.class);
      
      const text = document.createElement('span');
      text.textContent = item.text;
      
      legendItem.appendChild(colorBox);
      legendItem.appendChild(text);
      legend.appendChild(legendItem);
    });
    
    // Add to the document
    document.querySelector('.controls').appendChild(legend);
  }

  removeLegend() {
    const legend = document.getElementById('attack-legend');
    if (legend) {
      legend.remove();
    }
  }

  // Refresh attack visualization when board changes
  refreshVisualization() {
    if (this.active) {
      this.visualizeAttacks();
    }
  }
}