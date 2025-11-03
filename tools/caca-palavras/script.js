$(document).ready(function() {
    // Inicializar Select2 no select
    $('#allowDiagonal').select2({
        minimumResultsForSearch: Infinity, // Remove a barra de busca
        width: '100%',
        dropdownParent: $('#allowDiagonal').parent(),
        dropdownAutoWidth: true,
        dropdownCssClass: 'select2-dropdown-custom'
    });

    // Botão de Exemplo
    $('#btnExample').click(function() {
        const exampleWords = [
            'CACHORRO',
            'GATO',
            'PASSARO',
            'PEIXE',
            'COELHO',
            'TARTARUGA',
            'HAMSTER',
            'PAPAGAIO',
            'BORBOLETA',
            'FORMIGA'
        ];
        
        $('#wordsInput').val(exampleWords.join('\n'));
        
        // Feedback visual
        $(this).html('<span>✓</span><span>Exemplo Carregado</span>');
        setTimeout(() => {
            $(this).html('<span>✨</span><span>Gerar Exemplo</span>');
        }, 2000);
    });

    // Atalho de teclado global: Shift + Enter para gerar caça-palavras
    $(document).on('keydown', function(e) {
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            $('#btnGenerate').click();
        }
    });

    function showAlert(message) {
        $('#alertText').text(message);
        $('#alert').fadeIn();
        setTimeout(() => $('#alert').fadeOut(), 5000);
    }

    function hideAlert() {
        $('#alert').fadeOut();
    }

    let placedWords = [];

    $('#btnGenerate').click(function() {
        hideAlert();
        
        const gridSize = parseInt($('#gridSize').val());
        const allowDiagonal = $('#allowDiagonal').val() === 'true';
        const wordsText = $('#wordsInput').val().trim();

        if (!wordsText) {
            showAlert('Por favor, insira pelo menos uma palavra');
            return;
        }

        // Parse da lista de palavras
        const words = wordsText
            .split('\n')
            .map(word => word.trim().toUpperCase().replace(/[^A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/g, ''))
            .filter(word => word.length > 0);

        if (words.length === 0) {
            showAlert('Nenhuma palavra válida encontrada');
            return;
        }

        // Verificar se há palavras muito grandes
        const maxWordLength = words.reduce((max, word) => Math.max(max, word.length), 0);
        if (maxWordLength > gridSize) {
            showAlert(`A maior palavra tem ${maxWordLength} letras, mas a grade tem apenas ${gridSize}x${gridSize}. Aumente o tamanho da grade.`);
            return;
        }

        try {
            generateWordSearch(words, gridSize, allowDiagonal);
            
            $('#wordsearchContainer').fadeIn();
            $('#btnPrint').fadeIn();
            
            // Mostrar botão de recolher e recolher painel
            $('#toggleConfigBtn').fadeIn();
            $('#configPanel').addClass('collapsed');
            $('#toggleConfigBtn').html('<span>▼</span><span>Mostrar</span>');
            
            // Scroll suave
            setTimeout(() => {
                $('html, body').animate({
                    scrollTop: $('#wordsearchContainer').offset().top - 100
                }, 500);
            }, 300);
        } catch (error) {
            showAlert('Erro ao gerar caça-palavras: ' + error.message);
        }
    });

    function generateWordSearch(words, size, allowDiagonal) {
        // Criar grade vazia
        const grid = Array(size).fill().map(() => Array(size).fill(''));
        placedWords = [];

        // Ordenar palavras por tamanho (maiores primeiro)
        const sortedWords = [...words].sort((a, b) => b.length - a.length);

        // Direções possíveis
        const directions = [
            { dr: 0, dc: 1, name: 'horizontal' },      // horizontal (esquerda para direita)
            { dr: 1, dc: 0, name: 'vertical' },        // vertical (cima para baixo)
            { dr: 0, dc: -1, name: 'horizontal-rev' }, // horizontal reverso
            { dr: -1, dc: 0, name: 'vertical-rev' }    // vertical reverso
        ];

        if (allowDiagonal) {
            directions.push(
                { dr: 1, dc: 1, name: 'diagonal' },          // diagonal (↘)
                { dr: 1, dc: -1, name: 'diagonal-rev' },     // diagonal (↙)
                { dr: -1, dc: 1, name: 'diagonal-rev2' },    // diagonal (↗)
                { dr: -1, dc: -1, name: 'diagonal-rev3' }    // diagonal (↖)
            );
        }

        // Tentar colocar cada palavra
        for (const word of sortedWords) {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 100;
            
            // Primeira tentativa: procurar cruzamentos (70% das tentativas)
            const crossingAttempts = Math.floor(maxAttempts * 0.7);
            
            while (!placed && attempts < crossingAttempts) {
                const crossingPos = findCrossingPosition(grid, word, directions, size);
                
                if (crossingPos) {
                    placeWord(grid, word, crossingPos.row, crossingPos.col, crossingPos.direction);
                    placedWords.push({ word, row: crossingPos.row, col: crossingPos.col, direction: crossingPos.direction });
                    placed = true;
                }
                attempts++;
            }
            
            // Segunda tentativa: posição aleatória (30% restantes)
            while (!placed && attempts < maxAttempts) {
                const row = Math.floor(Math.random() * size);
                const col = Math.floor(Math.random() * size);
                const direction = directions[Math.floor(Math.random() * directions.length)];

                if (canPlaceWord(grid, word, row, col, direction, size)) {
                    placeWord(grid, word, row, col, direction);
                    placedWords.push({ word, row, col, direction });
                    placed = true;
                }
                attempts++;
            }
            
            // Se não conseguiu colocar a palavra após todas as tentativas
            if (!placed) {
                console.warn(`Não foi possível posicionar a palavra "${word}" após ${maxAttempts} tentativas`);
            }
        }

        // Preencher espaços vazios com letras aleatórias
        fillEmptySpaces(grid);

        // Resetar estado do jogo
        foundWords = [];
        currentGridSize = size;

        // Renderizar
        renderGrid(grid, size);
        renderWordsList(placedWords);
    }

    // Função para encontrar posição com cruzamento
    function findCrossingPosition(grid, word, directions, size) {
        // Procurar letras no grid que correspondem a letras da palavra
        const possibleCrossings = [];
        
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (grid[r][c] !== '') {
                    // Verificar cada letra da palavra
                    for (let i = 0; i < word.length; i++) {
                        if (grid[r][c] === word[i]) {
                            // Tentar cada direção
                            for (const direction of directions) {
                                const startRow = r - i * direction.dr;
                                const startCol = c - i * direction.dc;
                                
                                if (canPlaceWord(grid, word, startRow, startCol, direction, size)) {
                                    // Verificar se realmente cruza (tem pelo menos uma letra em comum)
                                    let hasCrossing = false;
                                    for (let j = 0; j < word.length; j++) {
                                        const checkR = startRow + j * direction.dr;
                                        const checkC = startCol + j * direction.dc;
                                        if (grid[checkR][checkC] !== '') {
                                            hasCrossing = true;
                                            break;
                                        }
                                    }
                                    
                                    if (hasCrossing) {
                                        possibleCrossings.push({
                                            row: startRow,
                                            col: startCol,
                                            direction: direction
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Retornar um cruzamento aleatório se houver
        if (possibleCrossings.length > 0) {
            return possibleCrossings[Math.floor(Math.random() * possibleCrossings.length)];
        }
        
        return null;
    }

    function canPlaceWord(grid, word, row, col, direction, size) {
        for (let i = 0; i < word.length; i++) {
            const r = row + i * direction.dr;
            const c = col + i * direction.dc;

            // Verificar se está dentro dos limites
            if (r < 0 || r >= size || c < 0 || c >= size) {
                return false;
            }

            // Verificar se a célula está vazia ou contém a mesma letra
            if (grid[r][c] !== '' && grid[r][c] !== word[i]) {
                return false;
            }
        }
        return true;
    }

    function placeWord(grid, word, row, col, direction) {
        for (let i = 0; i < word.length; i++) {
            const r = row + i * direction.dr;
            const c = col + i * direction.dc;
            grid[r][c] = word[i];
        }
    }

    function fillEmptySpaces(grid) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[r].length; c++) {
                if (grid[r][c] === '') {
                    grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
                }
            }
        }
    }

    function renderGrid(grid, size) {
        const cellSize = Math.min(40, Math.floor(600 / size));
        const fontSize = Math.max(12, Math.floor(cellSize * 0.5));

        let tableHTML = '<table class="grid-table">';
        
        // Linha de cabeçalho com letras (colunas)
        tableHTML += '<tr>';
        tableHTML += `<th class="grid-label corner-label"></th>`; // Canto superior esquerdo vazio
        for (let c = 0; c < size; c++) {
            const letter = String.fromCharCode(65 + c); // A, B, C, ...
            tableHTML += `<th class="grid-label col-label" style="width: ${cellSize}px;">${letter}</th>`;
        }
        tableHTML += '</tr>';
        
        // Linhas do grid com números na lateral
        for (let r = 0; r < size; r++) {
            tableHTML += '<tr>';
            tableHTML += `<th class="grid-label row-label" style="height: ${cellSize}px;">${r + 1}</th>`;
            for (let c = 0; c < size; c++) {
                tableHTML += `<td class="grid-cell" style="width: ${cellSize}px; height: ${cellSize}px; font-size: ${fontSize}px;">${grid[r][c]}</td>`;
            }
            tableHTML += '</tr>';
        }
        tableHTML += '</table>';
        $('#wordsearchGrid').html(tableHTML);
    }

    function renderWordsList(words) {
        let listHTML = '';
        words.forEach((wordData, index) => {
            listHTML += `
                <li class="word-item">
                    <span class="word-text">
                        <span class="word-number">${index + 1}.</span>${wordData.word}
                    </span>
                    <button class="btn-reveal" data-index="${index}" title="Revelar palavra">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </li>
            `;
        });
        $('#wordsList').html(listHTML);
    }

    // Função para revelar palavra
    $(document).on('click', '.btn-reveal', function() {
        const index = $(this).data('index');
        const wordData = placedWords[index];
        
        if (!wordData) return;
        
        // Destacar células da palavra
        const cells = [];
        for (let i = 0; i < wordData.word.length; i++) {
            const r = wordData.row + i * wordData.direction.dr;
            const c = wordData.col + i * wordData.direction.dc;
            cells.push({ r, c });
        }
        
        // Adicionar classe de destaque
        cells.forEach(cell => {
            // +1 na linha para pular o cabeçalho com letras
            const cellElement = $('.grid-table tr').eq(cell.r + 1).find('td').eq(cell.c);
            cellElement.addClass('revealed');
        });
        
        // Remover destaque após 3 segundos
        setTimeout(() => {
            cells.forEach(cell => {
                // +1 na linha para pular o cabeçalho com letras
                const cellElement = $('.grid-table tr').eq(cell.r + 1).find('td').eq(cell.c);
                cellElement.removeClass('revealed');
            });
        }, 3000);
    });

    // ========== SISTEMA DE JOGO INTERATIVO (DOIS CLIQUES) ==========
    
    let firstClick = null;
    let previewCells = [];
    let foundWords = [];
    let currentGridSize = 0;

    // Função para obter coordenadas de célula
    function getCellCoords(cell) {
        const $cell = $(cell);
        const $tr = $cell.parent();
        const row = $tr.index() - 1; // -1 para pular linha de cabeçalho com letras
        const col = $cell.index() - 1; // -1 para pular coluna com números das linhas
        return { row, col, element: $cell };
    }

    // Detectar movimento do mouse para preview
    $(document).on('mousemove', '.grid-cell', function() {
        if (!firstClick) return;
        
        const currentCoords = getCellCoords(this);
        
        // Limpar preview anterior
        $('.grid-cell.selecting').removeClass('selecting border-top border-bottom border-left border-right');
        previewCells = [];
        
        // Verificar se está na mesma linha (horizontal, vertical ou diagonal)
        if (isInSameLine(firstClick, currentCoords)) {
            // Obter células entre os dois pontos
            previewCells = getCellsInLine(firstClick, currentCoords);
            
            // Mostrar preview com bordas inteligentes
            applySmartBorders(previewCells);
        }
    });

    // Click na célula
    $(document).on('click', '.grid-cell', function(e) {
        e.preventDefault();
        
        const coords = getCellCoords(this);
        
        if (!firstClick) {
            // Primeiro clique
            firstClick = coords;
            $(this).addClass('selecting border-top border-bottom border-left border-right');
            previewCells = [coords];
        } else {
            // Segundo clique - validar seleção
            if (previewCells.length > 0) {
                validateSelection();
            }
            
            // Limpar estado
            $('.grid-cell.selecting').removeClass('selecting border-top border-bottom border-left border-right');
            firstClick = null;
            previewCells = [];
        }
    });

    // Cancelar seleção ao clicar fora do grid
    $(document).on('click', function(e) {
        if (firstClick && !$(e.target).hasClass('grid-cell')) {
            $('.grid-cell.selecting').removeClass('selecting border-top border-bottom border-left border-right');
            firstClick = null;
            previewCells = [];
        }
    });

    // Aplicar bordas inteligentes apenas no contorno da seleção
    function applySmartBorders(cells) {
        if (cells.length === 0) return;
        
        // Célula única - todas as bordas
        if (cells.length === 1) {
            cells[0].element.addClass('selecting border-top border-bottom border-left border-right');
            return;
        }
        
        // Determinar direção da seleção
        const rowDir = Math.sign(cells[1].row - cells[0].row);
        const colDir = Math.sign(cells[1].col - cells[0].col);
        
        cells.forEach((cell, index) => {
            cell.element.addClass('selecting');
            
            const isFirst = index === 0;
            const isLast = index === cells.length - 1;
            
            if (rowDir === 0 && colDir !== 0) {
                // Horizontal (→ ou ←)
                // Todas têm borda superior e inferior
                cell.element.addClass('border-top border-bottom');
                // Primeira tem borda no início
                if (isFirst) {
                    cell.element.addClass(colDir > 0 ? 'border-left' : 'border-right');
                }
                // Última tem borda no fim
                if (isLast) {
                    cell.element.addClass(colDir > 0 ? 'border-right' : 'border-left');
                }
            } else if (colDir === 0 && rowDir !== 0) {
                // Vertical (↓ ou ↑)
                // Todas têm borda esquerda e direita
                cell.element.addClass('border-left border-right');
                // Primeira tem borda no início
                if (isFirst) {
                    cell.element.addClass(rowDir > 0 ? 'border-top' : 'border-bottom');
                }
                // Última tem borda no fim
                if (isLast) {
                    cell.element.addClass(rowDir > 0 ? 'border-bottom' : 'border-top');
                }
            } else {
                // Diagonal - sempre todas as 4 bordas
                cell.element.addClass('border-top border-bottom border-left border-right');
            }
        });
    }

    // Verificar se dois pontos estão na mesma linha (horizontal, vertical ou diagonal)
    function isInSameLine(start, end) {
        const rowDiff = Math.abs(end.row - start.row);
        const colDiff = Math.abs(end.col - start.col);
        
        // Mesma linha (horizontal)
        if (rowDiff === 0) return true;
        
        // Mesma coluna (vertical)
        if (colDiff === 0) return true;
        
        // Diagonal
        if (rowDiff === colDiff) return true;
        
        return false;
    }

    // Obter todas as células em uma linha entre dois pontos
    function getCellsInLine(start, end) {
        const cells = [];
        
        const rowDiff = end.row - start.row;
        const colDiff = end.col - start.col;
        const steps = Math.max(Math.abs(rowDiff), Math.abs(colDiff));
        
        if (steps === 0) {
            return [start];
        }
        
        const rowStep = rowDiff === 0 ? 0 : rowDiff / Math.abs(rowDiff);
        const colStep = colDiff === 0 ? 0 : colDiff / Math.abs(colDiff);
        
        for (let i = 0; i <= steps; i++) {
            const row = start.row + (i * rowStep);
            const col = start.col + (i * colStep);
            const element = $('.grid-table tr').eq(row + 1).find('td').eq(col);
            cells.push({ row, col, element });
        }
        
        return cells;
    }

    // Validar seleção
    function validateSelection() {
        if (previewCells.length === 0) return;
        
        // Obter palavra selecionada
        const selectedWord = previewCells.map(cell => cell.element.text()).join('');
        
        // Verificar se corresponde a alguma palavra (normal ou reversa)
        for (let i = 0; i < placedWords.length; i++) {
            const wordData = placedWords[i];
            
            // Pular se já foi encontrada
            if (foundWords.includes(i)) continue;
            
            const word = wordData.word;
            const reversedWord = word.split('').reverse().join('');
            
            if (selectedWord === word || selectedWord === reversedWord) {
                // Palavra encontrada!
                markWordAsFound(i, previewCells);
                return;
            }
        }
        
        // Se chegou aqui, a palavra é inválida - limpar seleção
        $('.grid-cell.selecting').removeClass('selecting border-top border-bottom border-left border-right');
        firstClick = null;
        previewCells = [];
    }

    // Marcar palavra como encontrada
    function markWordAsFound(wordIndex, cells) {
        foundWords.push(wordIndex);

        // Marcar células no grid
        cells.forEach(cell => {
            cell.element.addClass('found');
        });
        
        // Marcar palavra na lista
        $('.word-item').eq(wordIndex).addClass('found');
        
        // Verificar se o jogo terminou
        checkGameComplete();
    }

    // Verificar se todas as palavras foram encontradas
    function checkGameComplete() {
        if (foundWords.length === placedWords.length && placedWords.length > 0) {
            setTimeout(() => {
                showFeedback('success', '🎉 Parabéns! 🎉', 'Você encontrou todas as palavras!');
                launchConfetti();
            }, 500);
        }
    }

    // Mostrar feedback
    function showFeedback(type, title, text) {
        const $modal = $('#feedbackModal');
        const $feedback = $('#feedbackMessage');
        
        $feedback.removeClass('success error');
        $feedback.addClass(type);
        $('#feedbackTitle').text(title);
        $('#feedbackText').text(text);
        
        // Mostrar/ocultar botão de novo jogo
        if (type === 'success') {
            $('#btnNewGame').show();
        } else {
            $('#btnNewGame').hide();
        }
        
        // Mostrar modal
        $modal.addClass('show');
    }

    // Fechar modal
    $(document).on('click', '#btnCloseModal, .feedback-modal', function(e) {
        if (e.target.id === 'btnCloseModal' || e.target.classList.contains('feedback-modal')) {
            $('#feedbackModal').removeClass('show');
            $('.confetti').remove();
        }
    });

    // Prevenir fechar ao clicar dentro do feedback
    $(document).on('click', '.feedback-message', function(e) {
        e.stopPropagation();
    });

    // Botão de Novo Jogo
    $(document).on('click', '#btnNewGame', function() {
        $('#feedbackModal').removeClass('show');
        $('.confetti').remove();
        $('#btnGenerate').click();
    });

    // Lançar confetes
    function launchConfetti() {
        const colors = ['var(--primary-400)', 'var(--primary-500)', 'var(--primary-600)', '#fbbf24', '#f59e0b', '#22c55e', '#3b82f6'];
        
        for (let i = 0; i < 150; i++) {
            setTimeout(() => {
                const size = Math.random() * 15 + 8;
                const startPosition = Math.random() * 100;
                const startTop = -(Math.random() * 100 + 50);
                
                const confetti = $('<div class="confetti"></div>');
                confetti.css({
                    left: startPosition + '%',
                    top: startTop + 'px',
                    width: size + 'px',
                    height: size + 'px',
                    background: colors[Math.floor(Math.random() * colors.length)],
                    animationDelay: Math.random() * 0.5 + 's',
                    animationDuration: (Math.random() * 3 + 3) + 's'
                });
                $('body').append(confetti);
                
                setTimeout(() => confetti.remove(), 6000);
            }, i * 20);
        }
    }

    // ========== FIM DO SISTEMA DE JOGO ==========

    $('#btnPrint').click(function() {
        window.print();
    });

    // Toggle do painel de configurações
    $('#toggleConfigBtn').click(function() {
        const panel = $('#configPanel');
        const btn = $(this);
        
        panel.toggleClass('collapsed');
        
        if (panel.hasClass('collapsed')) {
            btn.html('<span>▼</span><span>Mostrar</span>');
        } else {
            btn.html('<span>▲</span><span>Recolher</span>');
        }
    });
});
