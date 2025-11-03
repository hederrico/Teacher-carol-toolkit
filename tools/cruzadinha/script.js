$('#btnExample').click(function() {
    const exampleWords = [
        'CACHORRO: Animal de estimação que late',
        'GATO: Felino doméstico que mia',
        'BORBOLETA: Inseto colorido com asas',
        'ESCOLA: Lugar onde estudamos',
        'LIVRO: Objeto com páginas para ler',
        'COMPUTADOR: Máquina eletrônica para trabalhar',
        'BICICLETA: Veículo de duas rodas',
        'MÚSICA: Arte dos sons organizados',
        'FUTEBOL: Esporte jogado com os pés',
        'FLORESTA: Grande área com muitas árvores'
    ];
    
    $('#wordsList').val(exampleWords.join('\n'));
    
    // Feedback visual
    $(this).html('<span>✓</span><span>Exemplo Carregado</span>');
    setTimeout(() => {
        $(this).html('<span>✨</span><span>Gerar Exemplo</span>');
    }, 2000);
});

$('#btnGenerate').click(function() {
    const wordsList = $('#wordsList').val().trim();
    
    if (!wordsList) {
        showAlert('Por favor, insira pelo menos uma palavra com sua dica');
        return;
    }

    // Parse da lista de palavras
    const lines = wordsList.split('\n').filter(line => line.trim());
    const words = [];
    
    for (const line of lines) {
        // Aceitar tanto : quanto | como separadores
        const separatorIndex = line.indexOf(':') !== -1 ? line.indexOf(':') : line.indexOf('|');
        
        if (separatorIndex !== -1) {
            const word = line.substring(0, separatorIndex).trim().toUpperCase().replace(/[^A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/g, '');
            const clue = line.substring(separatorIndex + 1).trim();
            
            if (word.length > 1 && clue) {
                words.push({ word, clue });
            }
        }
    }

    if (words.length === 0) {
        showAlert('Nenhuma palavra válida encontrada. Use o formato: PALAVRA: Dica');
        return;
    }

    hideAlert();

    try {
        generateCrossword(words);
        
        $('#btnPrint').fadeIn();
        $('#toggleConfigBtn').fadeIn();
        $('#configPanel').addClass('collapsed');
        $('#toggleConfigBtn').html('<span>Mostrar</span><span>▼</span>');
        
        setTimeout(() => {
            $('html, body').animate({
                scrollTop: $('#crosswordContainer').offset().top - 100
            }, 500);
        }, 300);
    } catch (error) {
        showAlert('Erro ao gerar cruzadinha. Tente com palavras diferentes.');
        console.error(error);
    }
});

// Atalho de teclado global: Shift + Enter para gerar cruzadinha
$(document).on('keydown', function(e) {
    if (e.key === 'Enter' && e.shiftKey) {
        // Verificar se não está em um input da cruzadinha
        if (!$(e.target).closest('.grid-cell').length) {
            e.preventDefault();
            $('#btnGenerate').click();
        }
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

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function generateCrossword(inputWords) {
    // Embaralhar palavras para gerar resultados diferentes a cada vez
    const shuffledWords = shuffleArray([...inputWords]);
    
    // Ordenar palavras por tamanho (maiores primeiro)
    const words = shuffledWords.sort((a, b) => b.word.length - a.word.length);
    
    // Grid com tamanho máximo inicial
    const maxSize = 50;
    const grid = Array(maxSize).fill().map(() => Array(maxSize).fill(null));
    const placedWords = [];
    const usedWords = new Set(); // Rastrear palavras já colocadas
    let clueNumber = 1;

    // Colocar primeira palavra no centro (horizontal)
    const firstWord = words[0];
    const centerRow = Math.floor(maxSize / 2);
    const centerCol = Math.floor(maxSize / 2) - Math.floor(firstWord.word.length / 2);
    
    placeWord(grid, {
        word: firstWord.word,
        clue: firstWord.clue,
        direction: 'across',
        row: centerRow,
        col: centerCol,
        number: clueNumber++
    }, placedWords);
    
    usedWords.add(firstWord.word); // Marcar como usada

    // Tentar colocar as outras palavras
    for (let i = 1; i < words.length; i++) {
        const currentWord = words[i];
        
        // Pular se palavra já foi colocada
        if (usedWords.has(currentWord.word)) {
            console.warn(`Palavra já colocada, pulando: ${currentWord.word}`);
            continue;
        }
        
        let placed = false;
        const attempts = [];

        // Tentar intersecções com todas as palavras já colocadas
        for (const placedWord of placedWords) {
            // Tentar ambas as direções
            for (const direction of ['across', 'down']) {
                // Pular se mesma direção
                if (placedWord.direction === direction) continue;

                // Procurar letras em comum
                for (let p = 0; p < placedWord.word.length; p++) {
                    for (let c = 0; c < currentWord.word.length; c++) {
                        if (placedWord.word[p] === currentWord.word[c]) {
                            let newRow, newCol;
                            
                            if (direction === 'across') {
                                newRow = placedWord.row + (placedWord.direction === 'down' ? p : 0);
                                newCol = placedWord.col - c + (placedWord.direction === 'across' ? p : 0);
                            } else {
                                newRow = placedWord.row - c + (placedWord.direction === 'down' ? p : 0);
                                newCol = placedWord.col + (placedWord.direction === 'across' ? p : 0);
                            }

                            if (canPlaceWord(grid, currentWord.word, direction, newRow, newCol, maxSize)) {
                                // Contar intersecções reais
                                let intersectionCount = 0;
                                for (let i = 0; i < currentWord.word.length; i++) {
                                    const checkRow = direction === 'across' ? newRow : newRow + i;
                                    const checkCol = direction === 'across' ? newCol + i : newCol;
                                    
                                    if (grid[checkRow][checkCol] && grid[checkRow][checkCol].letter === currentWord.word[i]) {
                                        intersectionCount++;
                                    }
                                }
                                
                                attempts.push({
                                    word: currentWord.word,
                                    clue: currentWord.clue,
                                    direction: direction,
                                    row: newRow,
                                    col: newCol,
                                    number: clueNumber,
                                    intersections: intersectionCount
                                });
                            }
                        }
                    }
                }
            }
        }

        // Se encontrou opções, escolher a melhor
        if (attempts.length > 0) {
            // Ordenar por número de intersecções (menos é melhor para evitar complexidade)
            // e depois por proximidade ao centro
            attempts.sort((a, b) => {
                // Priorizar MENOS intersecções (1 é melhor que múltiplas)
                if (a.intersections !== b.intersections) {
                    return a.intersections - b.intersections;
                }
                // Se igual, escolher mais próximo do centro
                const distA = Math.abs(a.row - centerRow) + Math.abs(a.col - centerCol);
                const distB = Math.abs(b.row - centerRow) + Math.abs(b.col - centerCol);
                return distA - distB;
            });
            
            console.log(`Colocando "${currentWord.word}" com ${attempts[0].intersections} intersecção(ões)`);
            placeWord(grid, attempts[0], placedWords);
            usedWords.add(currentWord.word);
            clueNumber++;
            placed = true;
        }

        // Se não conseguiu colocar por intersecção, tentar colocar de forma independente
        if (!placed) {
            console.log(`Tentando colocar "${currentWord.word}" independentemente...`);
            
            // Tentar colocar em posições aleatórias próximas ao centro
            const tryPositions = [];
            const range = 10; // Área ao redor do centro para tentar
            
            for (let attempt = 0; attempt < 50; attempt++) {
                const direction = Math.random() > 0.5 ? 'across' : 'down';
                const randomRow = centerRow + Math.floor(Math.random() * range * 2 - range);
                const randomCol = centerCol + Math.floor(Math.random() * range * 2 - range);
                
                if (canPlaceWordIndependent(grid, currentWord.word, direction, randomRow, randomCol, maxSize)) {
                    const dist = Math.abs(randomRow - centerRow) + Math.abs(randomCol - centerCol);
                    tryPositions.push({
                        word: currentWord.word,
                        clue: currentWord.clue,
                        direction: direction,
                        row: randomRow,
                        col: randomCol,
                        number: clueNumber,
                        distance: dist
                    });
                }
            }
            
            if (tryPositions.length > 0) {
                // Escolher a mais próxima do centro
                tryPositions.sort((a, b) => a.distance - b.distance);
                console.log(`Colocando "${currentWord.word}" independentemente`);
                placeWord(grid, tryPositions[0], placedWords);
                usedWords.add(currentWord.word);
                clueNumber++;
                placed = true;
            }
        }

        if (!placed) {
            console.warn(`Não foi possível colocar a palavra: ${currentWord.word}`);
        }
    }

    // Calcular bounds compactos
    const bounds = calculateTightBounds(grid, placedWords);
    
    // Renderizar com tamanho dinâmico
    renderGrid(grid, bounds, placedWords);
    renderClues(placedWords);
    
    $('#crosswordContainer').fadeIn();
}

function placeWord(grid, wordData, placedWords) {
    const { word, direction, row, col } = wordData;
    
    for (let i = 0; i < word.length; i++) {
        const r = direction === 'down' ? row + i : row;
        const c = direction === 'across' ? col + i : col;
        
        if (!grid[r][c]) {
            // Célula vazia - criar nova
            grid[r][c] = {
                letter: word[i],
                number: i === 0 ? wordData.number : null
            };
        } else {
            // Célula já ocupada (intersecção)
            // Verificar se a letra é compatível
            if (grid[r][c].letter !== word[i]) {
                console.error(`ERRO: Tentando colocar ${word[i]} em célula com ${grid[r][c].letter}`);
                return false;
            }
            // Se for a primeira letra da palavra atual E não tem número ainda, adicionar
            if (i === 0 && !grid[r][c].number) {
                grid[r][c].number = wordData.number;
            }
        }
    }
    
    placedWords.push(wordData);
    return true;
}

function canPlaceWord(grid, word, direction, row, col, maxSize) {
    // Verificar limites
    if (direction === 'across') {
        if (col < 1 || col + word.length >= maxSize - 1 || row < 1 || row >= maxSize - 1) {
            return false;
        }
    } else {
        if (row < 1 || row + word.length >= maxSize - 1 || col < 1 || col >= maxSize - 1) {
            return false;
        }
    }

    let intersectionCount = 0;
    let hasIntersection = false;

    // Verificar cada posição da palavra
    for (let i = 0; i < word.length; i++) {
        const r = direction === 'down' ? row + i : row;
        const c = direction === 'across' ? col + i : col;
        
        const cell = grid[r][c];
        
        if (cell) {
            // Célula ocupada - deve ser intersecção válida
            if (cell.letter !== word[i]) {
                return false;
            }
            intersectionCount++;
            hasIntersection = true;
            
            // CORREÇÃO: Mesmo em interseções, verificar adjacências perpendiculares
            // para garantir que não há letras formando palavras inválidas
            if (direction === 'across') {
                // Palavra horizontal - verificar acima e abaixo
                // Mas permitir se for parte de outra palavra já colocada
                const cellAbove = grid[r - 1][c];
                const cellBelow = grid[r + 1][c];
                
                // Se há letra acima OU abaixo, deve haver nos dois lados (palavra cruzada)
                if ((cellAbove !== null) !== (cellBelow !== null)) {
                    // Apenas um lado tem letra - isso formaria uma palavra incompleta
                    return false;
                }
            } else {
                // Palavra vertical - verificar esquerda e direita
                const cellLeft = grid[r][c - 1];
                const cellRight = grid[r][c + 1];
                
                // Se há letra à esquerda OU à direita, deve haver nos dois lados (palavra cruzada)
                if ((cellLeft !== null) !== (cellRight !== null)) {
                    // Apenas um lado tem letra - isso formaria uma palavra incompleta
                    return false;
                }
            }
        } else {
            // Célula vazia - verificar adjacências perpendiculares
            if (direction === 'across') {
                // Palavra horizontal - verificar acima e abaixo
                if (grid[r - 1][c] !== null || grid[r + 1][c] !== null) {
                    return false;
                }
            } else {
                // Palavra vertical - verificar esquerda e direita
                if (grid[r][c - 1] !== null || grid[r][c + 1] !== null) {
                    return false;
                }
            }
        }
    }

    // Verificar espaço antes e depois da palavra
    // CORREÇÃO: Só verificar se não houver intersecção nas extremidades
    if (direction === 'across') {
        // Verificar antes (só se a primeira letra não for intersecção)
        if (!grid[row][col] && grid[row][col - 1] !== null) {
            return false;
        }
        // Verificar depois (só se a última letra não for intersecção)
        if (!grid[row][col + word.length - 1] && grid[row][col + word.length] !== null) {
            return false;
        }
    } else {
        // Verificar antes (só se a primeira letra não for intersecção)
        if (!grid[row][col] && grid[row - 1][col] !== null) {
            return false;
        }
        // Verificar depois (só se a última letra não for intersecção)
        if (!grid[row + word.length - 1][col] && grid[row + word.length][col] !== null) {
            return false;
        }
    }

    return intersectionCount >= 1;
}

function canPlaceWordIndependent(grid, word, direction, row, col, maxSize) {
    // Similar a canPlaceWord mas NÃO exige intersecções (para palavras independentes)
    
    // Verificar limites
    if (direction === 'across') {
        if (col < 1 || col + word.length >= maxSize - 1 || row < 1 || row >= maxSize - 1) {
            return false;
        }
    } else {
        if (row < 1 || row + word.length >= maxSize - 1 || col < 1 || col >= maxSize - 1) {
            return false;
        }
    }

    // Verificar espaço antes e depois da palavra
    if (direction === 'across') {
        if (grid[row][col - 1] !== null) return false;
        if (grid[row][col + word.length] !== null) return false;
    } else {
        if (grid[row - 1][col] !== null) return false;
        if (grid[row + word.length][col] !== null) return false;
    }

    // Verificar cada posição da palavra - TODAS devem estar vazias
    for (let i = 0; i < word.length; i++) {
        const r = direction === 'down' ? row + i : row;
        const c = direction === 'across' ? col + i : col;
        
        const cell = grid[r][c];
        
        if (cell) {
            // Já tem letra - não pode colocar independente
            return false;
        } else {
            // Célula vazia - verificar adjacências perpendiculares
            if (direction === 'across') {
                if (grid[r - 1][c] !== null || grid[r + 1][c] !== null) {
                    return false;
                }
            } else {
                if (grid[r][c - 1] !== null || grid[r][c + 1] !== null) {
                    return false;
                }
            }
        }
    }

    return true; // Permite colocar sem intersecções
}

function calculateTightBounds(grid, placedWords) {
    if (placedWords.length === 0) return { minRow: 0, maxRow: 10, minCol: 0, maxCol: 10 };

    let minRow = grid.length, maxRow = 0;
    let minCol = grid.length, maxCol = 0;

    for (const word of placedWords) {
        const endRow = word.direction === 'down' ? word.row + word.word.length - 1 : word.row;
        const endCol = word.direction === 'across' ? word.col + word.word.length - 1 : word.col;

        minRow = Math.min(minRow, word.row);
        maxRow = Math.max(maxRow, endRow);
        minCol = Math.min(minCol, word.col);
        maxCol = Math.max(maxCol, endCol);
    }

    // Sem margem - usar os limites exatos das palavras
    return {
        minRow: minRow,
        maxRow: maxRow,
        minCol: minCol,
        maxCol: maxCol
    };
}

function renderGrid(grid, bounds, placedWords) {
    const rows = bounds.maxRow - bounds.minRow + 1;
    const cols = bounds.maxCol - bounds.minCol + 1;
    
    // Calcular tamanho dinâmico das células (SEMPRE QUADRADAS)
    const maxGridSize = 600; // Tamanho máximo do grid em pixels
    const cellSize = Math.floor(Math.min(maxGridSize / cols, maxGridSize / rows));
    const fontSize = Math.max(10, Math.floor(cellSize * 0.35));
    const numberSize = Math.max(8, Math.floor(cellSize * 0.2));
    
    let tableHTML = '<table class="grid-table">';
    
    for (let i = bounds.minRow; i <= bounds.maxRow; i++) {
        tableHTML += '<tr>';
        for (let j = bounds.minCol; j <= bounds.maxCol; j++) {
            const cell = grid[i][j];
            
            if (cell) {
                const number = cell.number ? `<span class="cell-number" style="font-size: ${numberSize}px;">${cell.number}</span>` : '';
                
                tableHTML += `<td class="grid-cell filled" style="width: ${cellSize}px; height: ${cellSize}px; min-width: ${cellSize}px; min-height: ${cellSize}px; max-width: ${cellSize}px; max-height: ${cellSize}px; font-size: ${fontSize}px;" data-row="${i}" data-col="${j}" data-answer="${cell.letter}">${number}<input type="text" maxlength="1" data-row="${i}" data-col="${j}"></td>`;
            } else {
                tableHTML += `<td class="grid-cell blocked" style="width: ${cellSize}px; height: ${cellSize}px; min-width: ${cellSize}px; min-height: ${cellSize}px; max-width: ${cellSize}px; max-height: ${cellSize}px;"></td>`;
            }
        }
        tableHTML += '</tr>';
    }
    
    tableHTML += '</table>';
    $('#crosswordGrid').html(tableHTML);
    
    // Adicionar navegação com setas
    setupKeyboardNavigation();
}

function renderClues(placedWords) {
    const acrossClues = placedWords.filter(w => w.direction === 'across').sort((a, b) => a.number - b.number);
    const downClues = placedWords.filter(w => w.direction === 'down').sort((a, b) => a.number - b.number);

    let acrossHTML = '';
    if (acrossClues.length > 0) {
        acrossClues.forEach(item => {
            acrossHTML += `<li class="clue-item clickable-clue" data-row="${item.row}" data-col="${item.col}" data-direction="horizontal">
                <span class="clue-number">${item.number}.</span>${item.clue}
            </li>`;
        });
    } else {
        acrossHTML = '<li class="clue-item" style="font-style: italic; color: var(--color-text-secondary);">Nenhuma palavra horizontal</li>';
    }
    $('#acrossClues').html(acrossHTML);

    let downHTML = '';
    if (downClues.length > 0) {
        downClues.forEach(item => {
            downHTML += `<li class="clue-item clickable-clue" data-row="${item.row}" data-col="${item.col}" data-direction="vertical">
                <span class="clue-number">${item.number}.</span>${item.clue}
            </li>`;
        });
    } else {
        downHTML = '<li class="clue-item" style="font-style: italic; color: var(--color-text-secondary);">Nenhuma palavra vertical</li>';
    }
    $('#downClues').html(downHTML);
}

// Evento de clique nas dicas para focar no input correspondente
$(document).on('click', '.clickable-clue', function() {
    const row = $(this).data('row');
    const col = $(this).data('col');
    const direction = $(this).data('direction');
    
    // Encontrar o input correspondente
    const input = $(`.grid-cell input[data-row="${row}"][data-col="${col}"]`);
    
    if (input.length) {
        // Definir a direção global
        currentDirection = direction;
        isSequentialNavigation = false;
        
        // Focar no input
        input.focus();
        
        // Scroll suave até o input
        const container = $('#crosswordGrid');
        const offset = input.offset();
        const containerOffset = container.offset();
        
        if (offset && containerOffset) {
            $('html, body').animate({
                scrollTop: offset.top - 150
            }, 300);
        }
    }
});

$('#btnPrint').click(function() {
    window.print();
});

// Toggle do painel de configurações
$('#toggleConfigBtn').click(function() {
    const panel = $('#configPanel');
    const btn = $(this);
    
    panel.toggleClass('collapsed');
    
    if (panel.hasClass('collapsed')) {
        btn.html('<span>Mostrar</span><span>▼</span>');
    } else {
        btn.html('<span>Recolher</span><span>▲</span>');
    }
});

let currentDirection = null;
let lastFocusedCell = null;
let isSequentialNavigation = false;

function setupKeyboardNavigation() {
    $('.grid-cell input').on('focus', function(e) {
        const currentRow = parseInt($(this).data('row'));
        const currentCol = parseInt($(this).data('col'));
        
        // Verificar se esta célula tem número (início de palavra)
        const currentCell = $(`.grid-cell[data-row="${currentRow}"][data-col="${currentCol}"]`);
        const hasNumber = currentCell.find('.cell-number').length > 0;
        
        // CORREÇÃO: Só mudar direção se NÃO for navegação sequencial
        if (hasNumber && !isSequentialNavigation) {
            // É início de palavra E usuário clicou ou foi redirecionado
            // Redefinir direção baseado em adjacentes
            const hasRight = $(`.grid-cell input[data-row="${currentRow}"][data-col="${currentCol + 1}"]`).length > 0;
            const hasDown = $(`.grid-cell input[data-row="${currentRow + 1}"][data-col="${currentCol}"]`).length > 0;
            
            if (hasRight && !hasDown) {
                currentDirection = 'horizontal';
            } else if (hasDown && !hasRight) {
                currentDirection = 'vertical';
            } else if (hasRight && hasDown) {
                // Ambas direções - verificar qual está incompleta
                const horizontalIncomplete = !isWordComplete(currentRow, currentCol, 'horizontal');
                const verticalIncomplete = !isWordComplete(currentRow, currentCol, 'vertical');
                
                if (horizontalIncomplete && !verticalIncomplete) {
                    currentDirection = 'horizontal';
                } else if (verticalIncomplete && !horizontalIncomplete) {
                    currentDirection = 'vertical';
                } else {
                    // Ambas incompletas ou completas - priorizar horizontal
                    currentDirection = 'horizontal';
                }
            }
        } else if (lastFocusedCell && !isSequentialNavigation) {
            // Não é início - detectar direção pelo movimento (só se não for sequencial)
            const lastRow = lastFocusedCell.row;
            const lastCol = lastFocusedCell.col;
            
            if (currentRow === lastRow && currentCol !== lastCol) {
                currentDirection = 'horizontal';
            } else if (currentCol === lastCol && currentRow !== lastRow) {
                currentDirection = 'vertical';
            }
        }
        
        // Resetar flag de navegação sequencial após processar
        isSequentialNavigation = false;
        
        lastFocusedCell = { row: currentRow, col: currentCol };
    });

    $('.grid-cell input').on('keydown', function(e) {
        const key = e.key;
        const isLetter = key.length === 1 && /[A-ZÁÀÂÃÉÊÍÓÔÕÚÇa-záàâãéêíóôõúç]/.test(key);
        
        if (isLetter && $(this).val()) {
            // Se já tem valor e está digitando letra, limpar para permitir substituição
            $(this).val('');
        }
    });

    $('.grid-cell input').on('input', function() {
        let value = $(this).val().toUpperCase();
        
        // Validação: apenas letras (com acentos portugueses)
        value = value.replace(/[^A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/g, '');
        
        // Se digitou mais de 1 caractere, pegar apenas o último
        if (value.length > 1) {
            value = value.slice(-1);
        }
        
        $(this).val(value);
        
        if (value.length === 1) {
            const currentRow = parseInt($(this).data('row'));
            const currentCol = parseInt($(this).data('col'));
            
            let nextInput = findNextInput(currentRow, currentCol);
            
            if (nextInput && nextInput.length) {
                nextInput.focus();
            }
        }
        
        // Verificar automaticamente se todos os campos estão preenchidos
        checkAnswersAutomatically();
    });

    $('.grid-cell input').on('keydown', function(e) {
        const currentRow = parseInt($(this).data('row'));
        const currentCol = parseInt($(this).data('col'));
        let nextInput;

        switch(e.key) {
            case 'ArrowRight':
                e.preventDefault();
                currentDirection = 'horizontal';
                isSequentialNavigation = false; // Navegação manual por seta
                nextInput = $(`.grid-cell input[data-row="${currentRow}"][data-col="${currentCol + 1}"]`);
                if (nextInput.length) {
                    nextInput.focus();
                }
                break;
            case 'ArrowLeft':
                e.preventDefault();
                currentDirection = 'horizontal';
                isSequentialNavigation = false; // Navegação manual por seta
                nextInput = $(`.grid-cell input[data-row="${currentRow}"][data-col="${currentCol - 1}"]`);
                if (nextInput.length) {
                    nextInput.focus();
                }
                break;
            case 'ArrowDown':
                e.preventDefault();
                currentDirection = 'vertical';
                isSequentialNavigation = false; // Navegação manual por seta
                nextInput = $(`.grid-cell input[data-row="${currentRow + 1}"][data-col="${currentCol}"]`);
                if (nextInput.length) {
                    nextInput.focus();
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                currentDirection = 'vertical';
                isSequentialNavigation = false; // Navegação manual por seta
                nextInput = $(`.grid-cell input[data-row="${currentRow - 1}"][data-col="${currentCol}"]`);
                if (nextInput.length) {
                    nextInput.focus();
                }
                break;
            case 'Backspace':
                if ($(this).val() === '') {
                    e.preventDefault();
                    isSequentialNavigation = true; // Voltar é navegação sequencial
                    // Voltar na direção atual ou horizontal por padrão
                    if (currentDirection === 'vertical') {
                        nextInput = $(`.grid-cell input[data-row="${currentRow - 1}"][data-col="${currentCol}"]`);
                    } else {
                        nextInput = $(`.grid-cell input[data-row="${currentRow}"][data-col="${currentCol - 1}"]`);
                    }
                    
                    if (nextInput.length) {
                        nextInput.focus();
                        nextInput.val('');
                    }
                }
                break;
        }
    });
}

function findNextInput(currentRow, currentCol) {
    let nextInput;
    
    // Tentar célula adjacente direta primeiro
    if (currentDirection === 'horizontal') {
        nextInput = $(`.grid-cell input[data-row="${currentRow}"][data-col="${currentCol + 1}"]`);
    } else if (currentDirection === 'vertical') {
        nextInput = $(`.grid-cell input[data-row="${currentRow + 1}"][data-col="${currentCol}"]`);
    } else {
        // Sem direção definida - detectar baseado em adjacentes
        const hasRight = $(`.grid-cell input[data-row="${currentRow}"][data-col="${currentCol + 1}"]`).length > 0;
        const hasDown = $(`.grid-cell input[data-row="${currentRow + 1}"][data-col="${currentCol}"]`).length > 0;
        
        if (hasRight && !hasDown) {
            currentDirection = 'horizontal';
            nextInput = $(`.grid-cell input[data-row="${currentRow}"][data-col="${currentCol + 1}"]`);
        } else if (hasDown && !hasRight) {
            currentDirection = 'vertical';
            nextInput = $(`.grid-cell input[data-row="${currentRow + 1}"][data-col="${currentCol}"]`);
        } else if (hasRight) {
            currentDirection = 'horizontal';
            nextInput = $(`.grid-cell input[data-row="${currentRow}"][data-col="${currentCol + 1}"]`);
        }
    }
    
    // Se encontrou adjacente direto, marcar como navegação sequencial
    if (nextInput && nextInput.length) {
        isSequentialNavigation = true;
        return nextInput;
    }
    
    // Se não encontrou adjacente direto, terminou a palavra atual
    // Resetar direção para a próxima palavra
    currentDirection = null;
    isSequentialNavigation = false; // NÃO é navegação sequencial ao pular para nova palavra
    
    // Procurar próxima palavra incompleta
    nextInput = findAnyIncompleteWord();
    
    return nextInput;
}

function isWordComplete(startRow, startCol, direction) {
    // Verificar se todas as células da palavra estão preenchidas
    let row = startRow;
    let col = startCol;
    
    while (true) {
        const cell = $(`.grid-cell input[data-row="${row}"][data-col="${col}"]`);
        if (!cell.length) break;
        
        if (!cell.val()) {
            return false; // Encontrou célula vazia
        }
        
        if (direction === 'horizontal') {
            col++;
        } else {
            row++;
        }
    }
    
    return true;
}

function findAnyIncompleteWord() {
    // Procurar qualquer palavra que não esteja totalmente preenchida
    const allInputs = $('.grid-cell input').toArray();
    
    // Embaralhar para escolher aleatoriamente
    const shuffled = allInputs.sort(() => Math.random() - 0.5);
    
    for (let input of shuffled) {
        if (!$(input).val()) {
            const row = parseInt($(input).data('row'));
            const col = parseInt($(input).data('col'));
            
            // IMPORTANTE: Resetar direção antes de encontrar próxima palavra
            currentDirection = null;
            
            // Encontrar início da palavra que contém esta célula vazia
            const wordStart = findWordStart(row, col);
            
            // currentDirection já foi definida por findWordStart
            return wordStart;
        }
    }
    
    return null;
}

function findWordStart(row, col) {
    // Procurar início da palavra que contém esta posição
    // e detectar automaticamente a direção baseado no número da célula
    
    // Verificar se esta célula tem número (é início de palavra)
    const currentCell = $(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
    const hasNumber = currentCell.find('.cell-number').length > 0;
    
    if (hasNumber) {
        // Esta é uma célula de início de palavra
        // Verificar qual direção a palavra segue
        const hasRight = $(`.grid-cell input[data-row="${row}"][data-col="${col + 1}"]`).length > 0;
        const hasDown = $(`.grid-cell input[data-row="${row + 1}"][data-col="${col}"]`).length > 0;
        
        if (hasRight && !hasDown) {
            currentDirection = 'horizontal';
        } else if (hasDown && !hasRight) {
            currentDirection = 'vertical';
        } else if (hasRight && hasDown) {
            // Ambas direções - priorizar horizontal
            currentDirection = 'horizontal';
        }
        
        return $(`.grid-cell input[data-row="${row}"][data-col="${col}"]`);
    }
    
    // Não é início de palavra - procurar o início
    
    // Tentar encontrar início da palavra horizontal
    let startColH = col;
    while (true) {
        const prevCell = $(`.grid-cell input[data-row="${row}"][data-col="${startColH - 1}"]`);
        if (!prevCell.length) break;
        startColH--;
    }
    
    // Tentar encontrar início da palavra vertical
    let startRowV = row;
    while (true) {
        const prevCell = $(`.grid-cell input[data-row="${startRowV - 1}"][data-col="${col}"]`);
        if (!prevCell.length) break;
        startRowV--;
    }
    
    // Verificar qual palavra existe de fato
    const horizontalStart = $(`.grid-cell input[data-row="${row}"][data-col="${startColH}"]`);
    const verticalStart = $(`.grid-cell input[data-row="${startRowV}"][data-col="${col}"]`);
    
    // Contar tamanho de cada palavra
    let horizontalLength = 0;
    let tempCol = startColH;
    while ($(`.grid-cell input[data-row="${row}"][data-col="${tempCol}"]`).length) {
        horizontalLength++;
        tempCol++;
    }
    
    let verticalLength = 0;
    let tempRow = startRowV;
    while ($(`.grid-cell input[data-row="${tempRow}"][data-col="${col}"]`).length) {
        verticalLength++;
        tempRow++;
    }
    
    // Verificar qual início tem número (prioridade)
    const horizontalStartCell = $(`.grid-cell[data-row="${row}"][data-col="${startColH}"]`);
    const verticalStartCell = $(`.grid-cell[data-row="${startRowV}"][data-col="${col}"]`);
    const horizontalHasNumber = horizontalStartCell.find('.cell-number').length > 0;
    const verticalHasNumber = verticalStartCell.find('.cell-number').length > 0;
    
    // Se ambas existem (intersecção)
    if (horizontalLength > 1 && verticalLength > 1) {
        // Priorizar a que tem número E está incompleta
        const horizontalIncomplete = !isWordComplete(row, startColH, 'horizontal');
        const verticalIncomplete = !isWordComplete(startRowV, col, 'vertical');
        
        if (horizontalHasNumber && horizontalIncomplete) {
            currentDirection = 'horizontal';
            return horizontalStart;
        } else if (verticalHasNumber && verticalIncomplete) {
            currentDirection = 'vertical';
            return verticalStart;
        } else if (horizontalIncomplete) {
            currentDirection = 'horizontal';
            return horizontalStart;
        } else if (verticalIncomplete) {
            currentDirection = 'vertical';
            return verticalStart;
        } else {
            // Ambas completas - preferir horizontal
            currentDirection = 'horizontal';
            return horizontalStart;
        }
    } else if (horizontalLength > 1) {
        currentDirection = 'horizontal';
        return horizontalStart;
    } else if (verticalLength > 1) {
        currentDirection = 'vertical';
        return verticalStart;
    }
    
    // Fallback - resetar direção
    currentDirection = null;
    return null;
}

function checkAnswersAutomatically() {
    let allFilled = true;
    let allCorrect = true;

    $('.grid-cell.filled').each(function() {
        const input = $(this).find('input');
        const userAnswer = input.val().toUpperCase();

        if (!userAnswer) {
            allFilled = false;
            return false;
        }
    });

    if (!allFilled) {
        return; // Ainda não terminou de preencher
    }

    // Todos preenchidos, verificar se estão corretos
    $('.grid-cell.filled').each(function() {
        const input = $(this).find('input');
        const answer = $(this).data('answer');
        const userAnswer = input.val().toUpperCase();

        if (userAnswer !== answer) {
            allCorrect = false;
            return false;
        }
    });

    if (allCorrect) {
        showFeedback('success', '🎉 Parabéns! 🎉', 'Você completou a cruzadinha corretamente!');
        launchConfetti();
    } else {
        showFeedback('error', '❌ Ops!', 'Algumas respostas estão incorretas. Continue tentando!');
    }
}

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
    
    // Auto-fechar apenas para erros
    if (type === 'error') {
        setTimeout(() => {
            $modal.removeClass('show');
        }, 3000);
    }
}

// Fechar modal
$(document).on('click', '#btnCloseModal, .feedback-modal', function(e) {
    if (e.target.id === 'btnCloseModal' || e.target.classList.contains('feedback-modal')) {
        $('#feedbackModal').removeClass('show');
    }
});

// Prevenir fechar ao clicar dentro do feedback
$(document).on('click', '.feedback-message', function(e) {
    e.stopPropagation();
});

// Botão de Novo Jogo - agora reutiliza os dados existentes
$(document).on('click', '#btnNewGame', function() {
    // Fechar modal
    $('#feedbackModal').removeClass('show');
    
    // Limpar confete se houver
    $('.confetti').remove();
    
    // Regenerar a cruzadinha com as mesmas palavras
    const wordsList = $('#wordsList').val().trim();
    
    if (wordsList) {
        // Parse da lista de palavras novamente
        const lines = wordsList.split('\n').filter(line => line.trim());
        const words = [];
        
        for (const line of lines) {
            const separatorIndex = line.indexOf(':') !== -1 ? line.indexOf(':') : line.indexOf('|');
            
            if (separatorIndex !== -1) {
                const word = line.substring(0, separatorIndex).trim().toUpperCase().replace(/[^A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/g, '');
                const clue = line.substring(separatorIndex + 1).trim();
                
                if (word.length > 1 && clue) {
                    words.push({ word, clue });
                }
            }
        }
        
        if (words.length > 0) {
            try {
                generateCrossword(words);
                
                // Scroll suave para a cruzadinha
                setTimeout(() => {
                    $('html, body').animate({
                        scrollTop: $('#crosswordContainer').offset().top - 100
                    }, 500);
                }, 300);
            } catch (error) {
                console.error('Erro ao gerar nova cruzadinha:', error);
                showAlert('Erro ao gerar nova cruzadinha. Tente novamente.');
            }
        }
    }
});

function launchConfetti() {
    const colors = ['var(--primary-400)', 'var(--primary-500)', 'var(--primary-600)', '#fbbf24', '#f59e0b', '#22c55e', '#3b82f6'];
    
    for (let i = 0; i < 150; i++) {
        setTimeout(() => {
            const size = Math.random() * 15 + 8; // Tamanhos entre 8px e 23px
            const startPosition = Math.random() * 100; // Posição horizontal aleatória
            const startTop = -(Math.random() * 100 + 50); // Inicia entre -50px e -150px (acima da tela)
            
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
