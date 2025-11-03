$(document).ready(function() {
    // Botão de Exemplo
    $('#btnExample').click(function() {
        const exampleItems = [
            'Apple',
            'Banana',
            'Orange',
            'Grape',
            'Watermelon',
            'Strawberry',
            'Pineapple',
            'Mango',
            'Kiwi',
            'Peach',
            'Pear',
            'Cherry',
            'Lemon',
            'Coconut',
            'Avocado',
            'Blueberry'
        ];
        
        $('#options').val(exampleItems.join('\n'));
        
        // Feedback visual
        $(this).html('<span>✓</span><span>Exemplo Carregado</span>');
        setTimeout(() => {
            $(this).html('<span>✨</span><span>Gerar Exemplo</span>');
        }, 2000);
    });

    // Atalho de teclado global: Shift + Enter para gerar cartelas
    $(document).on('keydown', function(e) {
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            $('#btnGenerate').click();
        }
    });

    // Inicializar Select2 nos selects
    $('#gridSize').select2({
        minimumResultsForSearch: Infinity, // Remove a barra de busca
        width: '100%',
        dropdownParent: $('#gridSize').parent(),
        dropdownAutoWidth: true,
        dropdownCssClass: 'select2-dropdown-custom'
    });

    $('#drawingSpace').select2({
        minimumResultsForSearch: Infinity,
        width: '100%',
        dropdownParent: $('#drawingSpace').parent(),
        dropdownAutoWidth: true,
        dropdownCssClass: 'select2-dropdown-custom'
    });

    let generatedCards = [];

    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    function generateUniqueCard(items, size, existingCards) {
        const needed = size * size;
        if (items.length < needed) return null;

        let attempts = 0;
        const maxAttempts = 1000;

        while (attempts < maxAttempts) {
            const shuffled = shuffleArray(items);
            const card = shuffled.slice(0, needed);
            const cardKey = card.join('|');

            if (!existingCards.has(cardKey)) {
                existingCards.add(cardKey);
                return card;
            }
            attempts++;
        }
        return null;
    }

    function showAlert(message) {
        $('#alertText').text(message);
        $('#alert').fadeIn();
        setTimeout(() => $('#alert').fadeOut(), 5000);
    }

    function hideAlert() {
        $('#alert').fadeOut();
    }

    $('#btnGenerate').click(function() {
        hideAlert();
        
        const gridSize = parseInt($('#gridSize').val());
        const numCards = parseInt($('#numCards').val());
        const roomId = $('#roomId').val().toUpperCase();
        const optionsText = $('#options').val();
        const hasDrawingSpace = $('#drawingSpace').val() === 'true';

        const itemList = optionsText
            .split('\n')
            .map(item => item.trim())
            .filter(item => item.length > 0);

        const needed = gridSize * gridSize;

        if (itemList.length < needed) {
            showAlert(`Você precisa de pelo menos ${needed} opções para um bingo ${gridSize}x${gridSize}`);
            return;
        }

        if (roomId.length > 4) {
            showAlert('A identificação deve ter no máximo 4 caracteres');
            return;
        }

        if (!roomId) {
            showAlert('Por favor, insira uma identificação');
            return;
        }

        const existingCards = new Set();
        generatedCards = [];

        for (let i = 0; i < numCards; i++) {
            const card = generateUniqueCard(itemList, gridSize, existingCards);
            if (!card) {
                showAlert(`Aviso: Apenas ${i} cartelas únicas foram geradas. Adicione mais opções para gerar ${numCards} cartelas diferentes.`);
                break;
            }
            generatedCards.push(card);
        }

        if (generatedCards.length > 0) {
            renderCards(generatedCards, gridSize, roomId, hasDrawingSpace);
            $('#btnPrint').fadeIn();
            
            // Mostrar botão de recolher e recolher painel
            $('#toggleConfigBtn').fadeIn();
            $('#configPanel').addClass('collapsed');
            $('#toggleConfigBtn').html('<span>Mostrar</span><span>▼</span>');
            
            // Scroll suave para as cartelas
            setTimeout(() => {
                $('html, body').animate({
                    scrollTop: $('#cardsContainer').offset().top - 100
                }, 500);
            }, 300);
        }
    });

    $('#btnPrint').click(function() {
        window.print();
    });

    function renderCards(cards, size, roomId, hasDrawingSpace) {
        const container = $('#cardsContainer');
        container.empty();

        for (let i = 0; i < cards.length; i += 2) {
            const pageDiv = $('<div class="page-break"></div>');

            [cards[i], cards[i + 1]].forEach(card => {
                if (!card) return;

                const cardDiv = $('<div class="bingo-card"></div>');
                
                const header = $('<div class="card-header"><h2>BINGO</h2></div>');
                cardDiv.append(header);

                const grid = $(`<div class="bingo-grid grid-${size}"></div>`);
                
                card.forEach(item => {
                    let cellHTML;
                    if (hasDrawingSpace) {
                        cellHTML = `
                            <div class="bingo-cell">
                                <div class="cell-word">${item}</div>
                                <div class="cell-drawing"></div>
                            </div>
                        `;
                    } else {
                        cellHTML = `
                            <div class="bingo-cell bingo-cell-text-only">
                                <div class="cell-word-only">${item}</div>
                            </div>
                        `;
                    }
                    grid.append($(cellHTML));
                });

                cardDiv.append(grid);
                
                const badge = $(`<div class="card-badge">${roomId}</div>`);
                cardDiv.append(badge);

                const footer = $(`<div class="card-footer">© Caroline Castro</div>`);
                cardDiv.append(footer);

                pageDiv.append(cardDiv);
            });

            container.append(pageDiv);
        }

        container.fadeIn();
    }

    // Uppercase input
    $('#roomId').on('input', function() {
        $(this).val($(this).val().toUpperCase());
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
});
