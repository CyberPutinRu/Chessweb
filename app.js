document.addEventListener('DOMContentLoaded', () => {
    // Chess pieces Unicode
    const pieces = {
        'white': {
            'king': '♔',
            'queen': '♕',
            'rook': '♖',
            'bishop': '♗',
            'knight': '♘',
            'pawn': '♙'
        },
        'black': {
            'king': '♚',
            'queen': '♛',
            'rook': '♜',
            'bishop': '♝',
            'knight': '♞',
            'pawn': '♟'
        }
    };

    // Game state
    let gameState = {
        board: initializeBoard(),
        currentPlayer: 'white',
        selectedPiece: null,
        possibleMoves: [],
        capturedPieces: {
            'white': [],
            'black': []
        }
    };

    // Initialize board
    function initializeBoard() {
        const board = Array(8).fill().map(() => Array(8).fill(null));
        
        // Set pawns
        for (let i = 0; i < 8; i++) {
            board[1][i] = { type: 'pawn', color: 'black' };
            board[6][i] = { type: 'pawn', color: 'white' };
        }
        
        // Set other pieces
        const backRowPieces = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
        for (let i = 0; i < 8; i++) {
            board[0][i] = { type: backRowPieces[i], color: 'black' };
            board[7][i] = { type: backRowPieces[i], color: 'white' };
        }
        
        return board;
    }

    // Create the chessboard on the DOM
    function renderBoard() {
        const chessboard = document.getElementById('chessboard');
        chessboard.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.classList.add('square');
                square.classList.add((row + col) % 2 === 0 ? 'white' : 'black');
                square.dataset.row = row;
                square.dataset.col = col;
                
                const piece = gameState.board[row][col];
                if (piece) {
                    square.textContent = pieces[piece.color][piece.type];
                    square.dataset.piece = piece.type;
                    square.dataset.color = piece.color;
                }
                
                // Highlight possible moves
                if (gameState.possibleMoves.some(move => move.row === row && move.col === col)) {
                    square.classList.add('possible-move');
                }
                
                // Highlight selected piece
                if (gameState.selectedPiece && gameState.selectedPiece.row === row && gameState.selectedPiece.col === col) {
                    square.classList.add('selected');
                }
                
                square.addEventListener('click', handleSquareClick);
                chessboard.appendChild(square);
            }
        }
        
        // Update status
        document.querySelector('.status').textContent = `${gameState.currentPlayer.charAt(0).toUpperCase() + gameState.currentPlayer.slice(1)}'s turn`;
        document.getElementById('currentPlayer').textContent = gameState.currentPlayer.charAt(0).toUpperCase() + gameState.currentPlayer.slice(1);
        
        // Update captured pieces
        renderCapturedPieces();
    }

    // Render captured pieces
    function renderCapturedPieces() {
        const capturedBlack = document.getElementById('capturedBlack');
        const capturedWhite = document.getElementById('capturedWhite');
        
        capturedBlack.innerHTML = '';
        capturedWhite.innerHTML = '';
        
        gameState.capturedPieces.black.forEach(piece => {
            const pieceElement = document.createElement('span');
            pieceElement.textContent = pieces.black[piece];
            capturedBlack.appendChild(pieceElement);
        });
        
        gameState.capturedPieces.white.forEach(piece => {
            const pieceElement = document.createElement('span');
            pieceElement.textContent = pieces.white[piece];
            capturedWhite.appendChild(pieceElement);
        });
    }

    // Handle click on a square
    function handleSquareClick(event) {
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        const piece = gameState.board[row][col];
        
        // If no piece is selected and the square has a piece of the current player's color
        if (!gameState.selectedPiece && piece && piece.color === gameState.currentPlayer) {
            gameState.selectedPiece = { row, col, ...piece };
            gameState.possibleMoves = getPossibleMoves(row, col, piece);
            renderBoard();
        } 
        // If a piece is already selected
        else if (gameState.selectedPiece) {
            // If clicking on a possible move square
            if (gameState.possibleMoves.some(move => move.row === row && move.col === col)) {
                movePiece(gameState.selectedPiece, row, col);
                gameState.selectedPiece = null;
                gameState.possibleMoves = [];
                gameState.currentPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';
                renderBoard();
            } 
            // If clicking on another piece of the same color, select that piece instead
            else if (piece && piece.color === gameState.currentPlayer) {
                gameState.selectedPiece = { row, col, ...piece };
                gameState.possibleMoves = getPossibleMoves(row, col, piece);
                renderBoard();
            } 
            // If clicking elsewhere, deselect
            else {
                gameState.selectedPiece = null;
                gameState.possibleMoves = [];
                renderBoard();
            }
        }
    }

    // Move a piece
    function movePiece(selectedPiece, newRow, newCol) {
        const capturedPiece = gameState.board[newRow][newCol];
        if (capturedPiece) {
            gameState.capturedPieces[capturedPiece.color].push(capturedPiece.type);
        }
        
        // Update the board
        gameState.board[selectedPiece.row][selectedPiece.col] = null;
        gameState.board[newRow][newCol] = { type: selectedPiece.type, color: selectedPiece.color };
        
        // Pawn promotion to queen when reaching the opposite end
        if (selectedPiece.type === 'pawn') {
            if ((selectedPiece.color === 'white' && newRow === 0) || 
                (selectedPiece.color === 'black' && newRow === 7)) {
                gameState.board[newRow][newCol].type = 'queen';
            }
        }
    }

    // Get possible moves for a piece
    function getPossibleMoves(row, col, piece) {
        const moves = [];
        
        switch (piece.type) {
            case 'pawn':
                getPawnMoves(row, col, piece.color, moves);
                break;
            case 'rook':
                getRookMoves(row, col, piece.color, moves);
                break;
            case 'knight':
                getKnightMoves(row, col, piece.color, moves);
                break;
            case 'bishop':
                getBishopMoves(row, col, piece.color, moves);
                break;
            case 'queen':
                getRookMoves(row, col, piece.color, moves);
                getBishopMoves(row, col, piece.color, moves);
                break;
            case 'king':
                getKingMoves(row, col, piece.color, moves);
                break;
        }
        
        return moves;
    }

    // Pawn moves
    function getPawnMoves(row, col, color, moves) {
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;
        
        // Move forward one square
        if (isValidPosition(row + direction, col) && !gameState.board[row + direction][col]) {
            moves.push({ row: row + direction, col: col });
            
            // Move forward two squares if at starting position
            if (row === startRow && !gameState.board[row + 2 * direction][col]) {
                moves.push({ row: row + 2 * direction, col: col });
            }
        }
        
        // Capture diagonally
        const captureDirections = [{ row: row + direction, col: col - 1 }, { row: row + direction, col: col + 1 }];
        captureDirections.forEach(pos => {
            if (isValidPosition(pos.row, pos.col) && 
                gameState.board[pos.row][pos.col] && 
                gameState.board[pos.row][pos.col].color !== color) {
                moves.push(pos);
            }
        });
    }

    // Rook moves
    function getRookMoves(row, col, color, moves) {
        const directions = [
            { rowDir: 1, colDir: 0 },  // Down
            { rowDir: -1, colDir: 0 }, // Up
            { rowDir: 0, colDir: 1 },  // Right
            { rowDir: 0, colDir: -1 }  // Left
        ];
        
        for (let dir of directions) {
            let newRow = row + dir.rowDir;
            let newCol = col + dir.colDir;
            
            while (isValidPosition(newRow, newCol)) {
                if (!gameState.board[newRow][newCol]) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (gameState.board[newRow][newCol].color !== color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
                
                newRow += dir.rowDir;
                newCol += dir.colDir;
            }
        }
    }

    // Knight moves
    function getKnightMoves(row, col, color, moves) {
        const knightMoves = [
            { row: row - 2, col: col - 1 },
            { row: row - 2, col: col + 1 },
            { row: row - 1, col: col - 2 },
            { row: row - 1, col: col + 2 },
            { row: row + 1, col: col - 2 },
            { row: row + 1, col: col + 2 },
            { row: row + 2, col: col - 1 },
            { row: row + 2, col: col + 1 }
        ];
        
        knightMoves.forEach(move => {
            if (isValidPosition(move.row, move.col) && 
                (!gameState.board[move.row][move.col] || 
                 gameState.board[move.row][move.col].color !== color)) {
                moves.push(move);
            }
        });
    }

    // Bishop moves
    function getBishopMoves(row, col, color, moves) {
        const directions = [
            { rowDir: 1, colDir: 1 },   // Down-Right
            { rowDir: 1, colDir: -1 },  // Down-Left
            { rowDir: -1, colDir: 1 },  // Up-Right
            { rowDir: -1, colDir: -1 }  // Up-Left
        ];
        
        for (let dir of directions) {
            let newRow = row + dir.rowDir;
            let newCol = col + dir.colDir;
            
            while (isValidPosition(newRow, newCol)) {
                if (!gameState.board[newRow][newCol]) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (gameState.board[newRow][newCol].color !== color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
                
                newRow += dir.rowDir;
                newCol += dir.colDir;
            }
        }
    }

    // King moves
    function getKingMoves(row, col, color, moves) {
        const kingMoves = [
            { row: row - 1, col: col - 1 },
            { row: row - 1, col: col },
            { row: row - 1, col: col + 1 },
            { row: row, col: col - 1 },
            { row: row, col: col + 1 },
            { row: row + 1, col: col - 1 },
            { row: row + 1, col: col },
            { row: row + 1, col: col + 1 }
        ];
        
        kingMoves.forEach(move => {
            if (isValidPosition(move.row, move.col) && 
                (!gameState.board[move.row][move.col] || 
                 gameState.board[move.row][move.col].color !== color)) {
                moves.push(move);
            }
        });
        
        // Note: Castling not implemented for simplicity
    }

    // Check if position is on the board
    function isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    // Reset game
    document.getElementById('resetBtn').addEventListener('click', () => {
        gameState = {
            board: initializeBoard(),
            currentPlayer: 'white',
            selectedPiece: null,
            possibleMoves: [],
            capturedPieces: {
                'white': [],
                'black': []
            }
        };
        renderBoard();
    });

    // Initial render
    renderBoard();
});