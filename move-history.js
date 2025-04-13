class MoveHistory {
  constructor() {
    this.boardStates = [];
    this.moves = [];
    this.currentMoveIndex = -1;
    this.moveHistoryElement = document.getElementById('move-history');
    this.prevMoveButton = document.getElementById('prev-move-btn');
    this.nextMoveButton = document.getElementById('next-move-btn');
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.prevMoveButton.addEventListener('click', () => this.goToPreviousMove());
    this.nextMoveButton.addEventListener('click', () => this.goToNextMove());
  }

  addMove(move, boardState) {
    // If we're not at the end of the move list, truncate it
    if (this.currentMoveIndex < this.moves.length - 1) {
      this.moves = this.moves.slice(0, this.currentMoveIndex + 1);
      this.boardStates = this.boardStates.slice(0, this.currentMoveIndex + 1);
    }
    
    this.moves.push(move);
    this.boardStates.push(boardState);
    this.currentMoveIndex++;
    this.updateMoveHistoryView();
  }

  updateMoveHistoryView() {
    const moveList = document.createElement('ul');
    moveList.classList.add('move-history-list');
    
    this.moves.forEach((move, index) => {
      const moveItem = document.createElement('li');
      moveItem.textContent = move ? this.formatMoveNotation(move) : 'Initial Position';
      
      if (index === this.currentMoveIndex) {
        moveItem.classList.add('current-move');
      }
      
      moveItem.addEventListener('click', () => this.goToMove(index));
      moveList.appendChild(moveItem);
    });
    
    this.moveHistoryElement.innerHTML = '';
    this.moveHistoryElement.appendChild(moveList);
    
    // Update navigation button states
    this.prevMoveButton.disabled = this.currentMoveIndex <= 0;
    this.nextMoveButton.disabled = this.currentMoveIndex >= this.moves.length - 1;
  }

  formatMoveNotation(move) {
    const fileNames = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const rankNames = ['8', '7', '6', '5', '4', '3', '2', '1'];
    
    const startFile = fileNames[move.startCol];
    const startRank = rankNames[move.startRow];
    const endFile = fileNames[move.endCol];
    const endRank = rankNames[move.endRow];
    
    return `${move.piece} ${startFile}${startRank} → ${endFile}${endRank}`;
  }

  goToPreviousMove() {
    if (this.currentMoveIndex > 0) {
      this.currentMoveIndex--;
      this.restoreGameState();
    }
  }

  goToNextMove() {
    if (this.currentMoveIndex < this.moves.length - 1) {
      this.currentMoveIndex++;
      this.restoreGameState();
    }
  }

  goToMove(index) {
    this.currentMoveIndex = index;
    this.restoreGameState();
  }

  restoreGameState() {
    // This method will be set by the ChessGame class to restore the game state
    if (this.onRestoreState) {
      // Pass the board state corresponding to the current move index
      this.onRestoreState(this.boardStates[this.currentMoveIndex]);
    }
    this.updateMoveHistoryView();
  }

  reset() {
    this.moves = [];
    this.boardStates = [];
    this.currentMoveIndex = -1;
    this.updateMoveHistoryView();
  }
}