let gamePairs = [];
let connections = [];
let selectedItem = null;
let isConfigCollapsed = false;

const examplePairs = [
    {
        image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400',
        word: 'CACHORRO'
    },
    {
        image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
        word: 'GATO'
    },
    {
        image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
        word: 'COELHO'
    },
    {
        image: 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=400',
        word: 'PEIXE'
    },
    {
        image: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=400',
        word: 'PÁSSARO'
    }
];

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('btnExample').addEventListener('click', loadExample);
    
    document.getElementById('btnAddPair').addEventListener('click', () => addPairInput());
    
    document.getElementById('btnGenerate').addEventListener('click', generateGame);
    
    document.getElementById('btnPrint').addEventListener('click', () => window.print());
    
    document.getElementById('btnClear').addEventListener('click', clearConnections);
    
    document.getElementById('btnCheck').addEventListener('click', checkAnswers);
    
    document.getElementById('toggleConfigBtn').addEventListener('click', toggleConfig);
    
    document.addEventListener('keydown', (e) => {
        if (e.shiftKey && e.key === 'Enter') {
            e.preventDefault();
            generateGame();
        }
    });
}

function addPairInput() {
    const container = document.getElementById('pairsContainer');
    const addButton = document.getElementById('btnAddPair');
    const pairNumber = container.querySelectorAll('.pair-item').length + 1;
    
    const pairDiv = document.createElement('div');
    pairDiv.className = 'pair-item';
    pairDiv.dataset.pairNumber = pairNumber;
    
    pairDiv.innerHTML = `
        <div class="pair-number">${pairNumber}</div>
        <button type="button" class="btn-remove-pair" onclick="removePairInput(this)">✕</button>
        <div class="image-upload-zone" data-pair="${pairNumber}">
            <div class="upload-icon">🖼️</div>
            <div class="upload-text">
                <strong>Clique</strong> ou arraste
            </div>
            <div class="upload-subtext">para adicionar</div>
            <div class="or-divider">— ou —</div>
            <input type="url" class="image-url-input" placeholder="Cole URL aqui">
        </div>
        <input type="file" class="image-file-input" accept="image/*" style="display: none;">
        <div class="word-input-area">
            <input type="text" class="pair-word" placeholder="Descrição da imagem">
        </div>
    `;
    
    container.insertBefore(pairDiv, addButton);
    
    setupPairEventListeners(pairDiv);
}

function setupPairEventListeners(pairDiv) {
    const uploadZone = pairDiv.querySelector('.image-upload-zone');
    const fileInput = pairDiv.querySelector('.image-file-input');
    const urlInput = pairDiv.querySelector('.image-url-input');
    
    uploadZone.addEventListener('click', (e) => {
        if (!e.target.classList.contains('image-url-input') && 
            !e.target.classList.contains('btn-change-image') && 
            !e.target.classList.contains('btn-remove-image')) {
            fileInput.click();
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                displayImagePreview(uploadZone, event.target.result);
            };
            reader.readAsDataURL(file);
        }
    });
    
    urlInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url && isValidUrl(url)) {
            displayImagePreview(uploadZone, url);
        }
    });
    
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--primary-600)';
        uploadZone.style.background = 'var(--primary-200)';
    });
    
    uploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = '';
        uploadZone.style.background = '';
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = '';
        uploadZone.style.background = '';
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                displayImagePreview(uploadZone, event.target.result);
            };
            reader.readAsDataURL(file);
        }
    });
}

function displayImagePreview(uploadZone, imageUrl) {
    uploadZone.classList.add('has-image');
    uploadZone.innerHTML = `
        <img src="${imageUrl}" alt="Preview" class="image-preview" onerror="handleImageError(this)">
        <div class="image-actions">
            <button type="button" class="btn-change-image" title="Alterar imagem">🔄</button>
        </div>
    `;
    
    uploadZone.dataset.imageUrl = imageUrl;
    
    const btnChange = uploadZone.querySelector('.btn-change-image');
    const pairDiv = uploadZone.closest('.pair-item');
    const fileInput = pairDiv.querySelector('.image-file-input');
    
    btnChange.addEventListener('click', (e) => {
        e.stopPropagation();
        resetUploadZone(uploadZone);
    });
}

function resetUploadZone(uploadZone) {
    const pairNumber = uploadZone.dataset.pair;
    uploadZone.classList.remove('has-image');
    delete uploadZone.dataset.imageUrl;
    
    uploadZone.innerHTML = `
        <div class="upload-icon">🖼️</div>
        <div class="upload-text">
            <strong>Clique</strong> ou arraste
        </div>
        <div class="upload-subtext">para adicionar</div>
        <div class="or-divider">— ou —</div>
        <input type="url" class="image-url-input" placeholder="Cole URL aqui">
    `;
    
    const pairDiv = uploadZone.closest('.pair-item');
    const urlInput = uploadZone.querySelector('.image-url-input');
    const fileInput = pairDiv.querySelector('.image-file-input');
    fileInput.value = '';
    
    urlInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url && isValidUrl(url)) {
            displayImagePreview(uploadZone, url);
        }
    });
}

function handleImageError(img) {
    img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%236b7280'%3EImagem não encontrada%3C/text%3E%3C/svg%3E";
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function removePairInput(button) {
    const pairItem = button.closest('.pair-item');
    pairItem.remove();
    
    const container = document.getElementById('pairsContainer');
    Array.from(container.children).forEach((pair, index) => {
        const number = index + 1;
        pair.dataset.pairNumber = number;
        pair.querySelector('.pair-number').textContent = number;
    });
}

function loadExample() {
    const container = document.getElementById('pairsContainer');
    container.innerHTML = '';
    
    examplePairs.forEach((example, index) => {
        addPairInput();
    });
    
    setTimeout(() => {
        const pairItems = container.querySelectorAll('.pair-item');
        
        pairItems.forEach((pairItem, index) => {
            const uploadZone = pairItem.querySelector('.image-upload-zone');
            const wordInput = pairItem.querySelector('.pair-word');
            
            displayImagePreview(uploadZone, examplePairs[index].image);
            
            wordInput.value = examplePairs[index].word;
        });
    }, 100);
}

function generateGame() {
    const pairs = collectPairs();
    
    if (!validatePairs(pairs)) {
        return;
    }
    
    gamePairs = pairs.map((pair, index) => ({
        id: index,
        image: pair.image,
        word: pair.word
    }));
    
    const shuffledImages = shuffleArray([...gamePairs]);
    const shuffledWords = shuffleArray([...gamePairs]);
    
    renderGame(shuffledImages, shuffledWords);
    
    document.getElementById('gameContainer').style.display = 'block';
    document.getElementById('btnPrint').style.display = 'flex';
    
    collapseConfig();
    
    hideAlert();
    
    setTimeout(() => {
        document.getElementById('gameContainer').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }, 100);
}

function collectPairs() {
    const container = document.getElementById('pairsContainer');
    const pairItems = container.querySelectorAll('.pair-item');
    const pairs = [];
    
    pairItems.forEach(pairItem => {
        const uploadZone = pairItem.querySelector('.image-upload-zone');
        const image = uploadZone.dataset.imageUrl;
        const word = pairItem.querySelector('.pair-word').value.trim().toUpperCase();
        
        if (image && word) {
            pairs.push({ image, word });
        }
    });
    
    return pairs;
}

function validatePairs(pairs) {
    if (pairs.length < 3) {
        showAlert('Por favor, adicione pelo menos 3 pares de imagem e palavra!', 'error');
        return false;
    }
    
    const container = document.getElementById('pairsContainer');
    const pairItems = container.querySelectorAll('.pair-item');
    
    for (let i = 0; i < pairItems.length; i++) {
        const uploadZone = pairItems[i].querySelector('.image-upload-zone');
        const image = uploadZone.dataset.imageUrl;
        const word = pairItems[i].querySelector('.pair-word').value.trim();
        
        if (!image) {
            showAlert(`Por favor, adicione uma imagem ao par ${i + 1}!`, 'error');
            pairItems[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
            return false;
        }
        
        if (!word) {
            showAlert(`Por favor, adicione uma palavra ao par ${i + 1}!`, 'error');
            pairItems[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
            return false;
        }
    }
    
    return true;
}

function renderGame(shuffledImages, shuffledWords) {
    const imagesContainer = document.getElementById('imagesList');
    const wordsContainer = document.getElementById('wordsList');
    
    imagesContainer.innerHTML = '';
    wordsContainer.innerHTML = '';
    
    connections = [];
    selectedItem = null;
    document.getElementById('connectionsSvg').innerHTML = '<defs><marker id="arrowhead" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><polygon points="0 0, 10 5, 0 10" fill="var(--primary-500)" /></marker></defs>';
    
    shuffledImages.forEach((pair, index) => {
        const imageDiv = document.createElement('div');
        imageDiv.className = 'image-item';
        imageDiv.dataset.id = pair.id;
        imageDiv.dataset.type = 'image';
        imageDiv.dataset.index = index;
        
        imageDiv.innerHTML = `
            <img src="${pair.image}" alt="${pair.word}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect width=%22400%22 height=%22300%22 fill=%22%23e5e7eb%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2220%22 fill=%22%236b7280%22%3EImagem não encontrada%3C/text%3E%3C/svg%3E'">
            <div class="connection-point"></div>
        `;
        
        imageDiv.addEventListener('click', () => handleItemClick(imageDiv));
        imagesContainer.appendChild(imageDiv);
    });
    
    shuffledWords.forEach((pair, index) => {
        const wordDiv = document.createElement('div');
        wordDiv.className = 'word-item';
        wordDiv.dataset.id = pair.id;
        wordDiv.dataset.type = 'word';
        wordDiv.dataset.index = index;
        
        wordDiv.innerHTML = `
            <div class="word-text">${pair.word}</div>
            <div class="connection-point"></div>
        `;
        
        wordDiv.addEventListener('click', () => handleItemClick(wordDiv));
        wordsContainer.appendChild(wordDiv);
    });
    
    const feedbackMessage = document.getElementById('feedbackMessage');
    feedbackMessage.style.display = 'none';
    feedbackMessage.className = 'feedback-message';
}

function handleItemClick(item) {
    const itemType = item.dataset.type;
    const itemId = parseInt(item.dataset.id);
    
    if (!selectedItem) {
        selectedItem = { element: item, type: itemType, id: itemId };
        item.classList.add('selected');
        return;
    }
    
    if (selectedItem.element === item) {
        item.classList.remove('selected');
        selectedItem = null;
        return;
    }
    
    if (selectedItem.type === itemType) {
        selectedItem.element.classList.remove('selected');
        selectedItem = { element: item, type: itemType, id: itemId };
        item.classList.add('selected');
        return;
    }
    
    const firstItem = selectedItem;
    const secondItem = { element: item, type: itemType, id: itemId };
    
    const existingConnection = connections.find(conn => 
        (conn.image === firstItem.element && conn.word === secondItem.element) ||
        (conn.image === secondItem.element && conn.word === firstItem.element)
    );
    
    if (existingConnection) {
        showAlert('Esses itens já estão conectados!', 'error');
        firstItem.element.classList.remove('selected');
        selectedItem = null;
        return;
    }
    
    const firstAlreadyConnected = connections.some(conn => 
        conn.image === firstItem.element || conn.word === firstItem.element
    );
    const secondAlreadyConnected = connections.some(conn => 
        conn.image === secondItem.element || conn.word === secondItem.element
    );
    
    if (firstAlreadyConnected || secondAlreadyConnected) {
        showAlert('Um ou ambos os itens já estão conectados!', 'error');
        firstItem.element.classList.remove('selected');
        selectedItem = null;
        return;
    }
    
    createConnection(firstItem, secondItem);
    
    firstItem.element.classList.remove('selected');
    item.classList.remove('selected');
    selectedItem = null;
}

function createConnection(item1, item2) {
    let imageItem, wordItem;
    if (item1.type === 'image') {
        imageItem = item1;
        wordItem = item2;
    } else {
        imageItem = item2;
        wordItem = item1;
    }
    
    connections.push({
        image: imageItem.element,
        word: wordItem.element,
        imageId: imageItem.id,
        wordId: wordItem.id
    });
    
    imageItem.element.classList.add('connected');
    wordItem.element.classList.add('connected');
    
    drawConnection(imageItem.element, wordItem.element);
}

function drawConnection(imageElement, wordElement) {
    const svg = document.getElementById('connectionsSvg');
    const imageRect = imageElement.getBoundingClientRect();
    const wordRect = wordElement.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    
    const x1 = imageRect.right - svgRect.left;
    const y1 = imageRect.top + imageRect.height / 2 - svgRect.top;
    const x2 = wordRect.left - svgRect.left;
    const y2 = wordRect.top + wordRect.height / 2 - svgRect.top;
    
    const midX = (x1 + x2) / 2;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    const d = `M ${x1} ${y1} Q ${midX} ${y1}, ${midX} ${(y1 + y2) / 2} T ${x2} ${y2}`;
    
    path.setAttribute('d', d);
    path.setAttribute('class', 'connection-line');
    path.setAttribute('data-image', imageElement.dataset.index);
    path.setAttribute('data-word', wordElement.dataset.index);
    
    svg.appendChild(path);
}

function clearConnections() {
    connections = [];
    
    document.querySelectorAll('.image-item, .word-item').forEach(item => {
        item.classList.remove('connected', 'selected', 'correct', 'incorrect');
    });
    
    const svg = document.getElementById('connectionsSvg');
    svg.innerHTML = '<defs><marker id="arrowhead" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><polygon points="0 0, 10 5, 0 10" fill="var(--primary-500)" /></marker></defs>';
    
    selectedItem = null;
    
    const feedbackMessage = document.getElementById('feedbackMessage');
    feedbackMessage.style.display = 'none';
    feedbackMessage.className = 'feedback-message';
}

function checkAnswers() {
    if (connections.length === 0) {
        showAlert('Faça pelo menos uma conexão antes de verificar!', 'error');
        return;
    }
    
    let correctCount = 0;
    const totalPairs = gamePairs.length;
    
    connections.forEach(conn => {
        const isCorrect = conn.imageId === conn.wordId;
        
        if (isCorrect) {
            correctCount++;
            conn.image.classList.add('correct');
            conn.word.classList.add('correct');
            
            const line = document.querySelector(`path[data-image="${conn.image.dataset.index}"][data-word="${conn.word.dataset.index}"]`);
            if (line) {
                line.classList.add('correct');
            }
        } else {
            conn.image.classList.add('incorrect');
            conn.word.classList.add('incorrect');
            
            const line = document.querySelector(`path[data-image="${conn.image.dataset.index}"][data-word="${conn.word.dataset.index}"]`);
            if (line) {
                line.classList.add('incorrect');
            }
        }
    });
    
    const feedbackMessage = document.getElementById('feedbackMessage');
    feedbackMessage.style.display = 'block';
    
    if (correctCount === totalPairs && connections.length === totalPairs) {
        feedbackMessage.className = 'feedback-message success';
        feedbackMessage.innerHTML = `
            🎉 <strong>Parabéns!</strong> Você acertou todas as ${totalPairs} conexões!
        `;
        createConfetti();
    } else if (correctCount > 0) {
        feedbackMessage.className = 'feedback-message partial';
        feedbackMessage.innerHTML = `
            👍 Você acertou <strong>${correctCount}</strong> de <strong>${connections.length}</strong> conexões!
            ${connections.length < totalPairs ? `<br>Ainda faltam ${totalPairs - connections.length} pares para conectar.` : ''}
        `;
    } else {
        feedbackMessage.className = 'feedback-message error';
        feedbackMessage.innerHTML = `
            😕 Nenhuma conexão está correta. Tente novamente!
        `;
    }
    
    setTimeout(() => {
        feedbackMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

function createConfetti() {
    const colors = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = (Math.random() * 3 + 3) + 's';
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 5000);
        }, i * 30);
    }
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function showAlert(message, type = 'error') {
    const alert = document.getElementById('alert');
    const alertText = document.getElementById('alertText');
    
    alertText.textContent = message;
    alert.style.display = 'block';
    
    if (type === 'success') {
        alert.style.background = '#d1fae5';
        alert.style.borderColor = '#10b981';
        alertText.style.color = '#065f46';
    } else {
        alert.style.background = '#fef3c7';
        alert.style.borderColor = '#fbbf24';
        alertText.style.color = '#92400e';
    }
    
    setTimeout(() => {
        alert.style.display = 'none';
    }, 5000);
}

function hideAlert() {
    document.getElementById('alert').style.display = 'none';
}

function toggleConfig() {
    const configPanel = document.getElementById('configPanel');
    const toggleBtn = document.getElementById('toggleConfigBtn');
    
    isConfigCollapsed = !isConfigCollapsed;
    
    if (isConfigCollapsed) {
        configPanel.classList.add('collapsed');
        toggleBtn.querySelector('span:last-child').textContent = 'Expandir';
    } else {
        configPanel.classList.remove('collapsed');
        toggleBtn.querySelector('span:last-child').textContent = 'Recolher';
    }
}

function collapseConfig() {
    const configPanel = document.getElementById('configPanel');
    const toggleBtn = document.getElementById('toggleConfigBtn');
    
    configPanel.classList.add('collapsed');
    toggleBtn.style.display = 'inline-flex';
    toggleBtn.querySelector('span:last-child').textContent = 'Expandir';
    isConfigCollapsed = true;
}

window.addEventListener('resize', () => {
    if (connections.length > 0) {
        const svg = document.getElementById('connectionsSvg');
        svg.innerHTML = '<defs><marker id="arrowhead" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><polygon points="0 0, 10 5, 0 10" fill="var(--primary-500)" /></marker></defs>';
        
        connections.forEach(conn => {
            drawConnection(conn.image, conn.word);
            
            const line = svg.lastChild;
            if (conn.image.classList.contains('correct')) {
                line.classList.add('correct');
            } else if (conn.image.classList.contains('incorrect')) {
                line.classList.add('incorrect');
            }
        });
    }
});
