// ==========================================
// LOGICA NAVIGAZIONE TABS
// ==========================================
function openTab(tabId, element) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
    element.classList.add('active');
}

// ==========================================
// FUNZIONALITÀ INTERFACCIA: FULLSCREEN
// ==========================================
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Errore nel tentativo di attivare lo schermo intero: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

// ==========================================
// LOGICA MAPPA MATRIX
// ==========================================
const COLS = 26;
const ROWS = 19;
let isDrawing = false;

function hasWallRight(y, x) {
    const key = `${y},${x}`;
    return mapData[key] && mapData[key].wallRight === true;
}

function hasWallBottom(y, x) {
    const key = `${y},${x}`;
    return mapData[key] && mapData[key].wallBottom === true;
}

const boardElement = document.getElementById('board');

// Generazione dinamica della scacchiera calata a 40px
for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.id = `cell-${y}-${x}`;
        cell.dataset.y = y;
        cell.dataset.x = x;
        
        if (hasWallRight(y, x)) cell.classList.add('wall-right');
        if (hasWallBottom(y, x)) cell.classList.add('wall-bottom');
        
        if (!hasWallBottom(y, x) && !hasWallRight(y, x) && hasWallBottom(y, x + 1) && hasWallRight(y + 1, x)) {
            cell.classList.add('corner-br');
        }

        const heroes = [
            { key: 'b', label: 'B' },
            { key: 'n', label: 'N' },
            { key: 'e', label: 'E' },
            { key: 'm', label: 'M' }
        ];

        heroes.forEach(h => {
            const row = document.createElement('div');
            row.className = 'hero-row';
            row.dataset.hero = h.key;

            const label = document.createElement('span');
            label.className = 'hero-label';
            label.textContent = h.label;

            const indicators = document.createElement('div');
            indicators.className = 'search-indicators';

            const indTreasure = document.createElement('span');
            indTreasure.className = 'indicator ind-treasure';
            indTreasure.textContent = '💰';
            indTreasure.title = 'Tesori';

            const indTrap = document.createElement('span');
            indTrap.className = 'indicator ind-trap';
            indTrap.textContent = '⚠️';
            indTrap.title = 'Trappole';

            const indSecret = document.createElement('span');
            indSecret.className = 'indicator ind-secret';
            indSecret.textContent = '🚪';
            indSecret.title = 'Porte Segrete';

            indicators.appendChild(indTreasure);
            indicators.appendChild(indTrap);
            indicators.appendChild(indSecret);
            
            row.appendChild(label);
            row.appendChild(indicators);
            cell.appendChild(row);
        });
        
        boardElement.appendChild(cell);
    }
}

function generateRooms() {
    let visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    let currentRoomId = 0;

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (!visited[y][x]) {
                currentRoomId++;
                let queue = [{ y, x }];
                visited[y][x] = true;

                while (queue.length > 0) {
                    let curr = queue.shift();
                    let cellElement = document.getElementById(`cell-${curr.y}-${curr.x}`);
                    if (cellElement) {
                        cellElement.dataset.roomId = currentRoomId;
                    }
                    
                    if (curr.y > 0 && !hasWallBottom(curr.y - 1, curr.x) && !visited[curr.y - 1][curr.x]) { visited[curr.y - 1][curr.x] = true; queue.push({ y: curr.y - 1, x: curr.x }); }
                    if (curr.y < ROWS - 1 && !hasWallBottom(curr.y, curr.x) && !visited[curr.y + 1][curr.x]) { visited[curr.y + 1][curr.x] = true; queue.push({ y: curr.y + 1, x: curr.x }); }
                    if (curr.x > 0 && !hasWallRight(curr.y, curr.x - 1) && !visited[curr.y][curr.x - 1]) { visited[curr.y][curr.x - 1] = true; queue.push({ y: curr.y, x: curr.x - 1 }); }
                    if (curr.x < COLS - 1 && !hasWallRight(curr.y, curr.x) && !visited[curr.y][curr.x + 1]) { visited[curr.y][curr.x + 1] = true; queue.push({ y: curr.y, x: curr.x + 1 }); }
                }
            }
        }
    }
}

generateRooms();

function applyToolToCell(cell) {
    const selectedScope = document.querySelector('input[name="scope"]:checked').value;
    const selectedHero = document.querySelector('input[name="hero"]:checked').value;
    const selectedTool = document.querySelector('input[name="tool"]:checked').value;
    const selectedMode = document.querySelector('input[name="mode"]:checked').value;
    
    let targetCells = [];

    if (selectedScope === 'room') {
        const roomId = cell.dataset.roomId;
        targetCells = Array.from(document.querySelectorAll(`.cell[data-room-id="${roomId}"]`));
    } else {
        targetCells = [cell];
    }

    const heroesToUpdate = selectedHero === 'all' ? ['b', 'n', 'e', 'm'] : [selectedHero];

    targetCells.forEach(c => {
        heroesToUpdate.forEach(h => {
            const row = c.querySelector(`.hero-row[data-hero="${h}"]`);
            if (!row) return;

            const indicator = row.querySelector(`.ind-${selectedTool}`);
            if (!indicator) return;

            if (selectedMode === 'add') {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    });
    saveState();
}

boardElement.addEventListener('mousedown', (e) => {
    const cell = e.target.closest('.cell');
    if (cell) {
        isDrawing = true;
        applyToolToCell(cell);
    }
});

window.addEventListener('mouseup', () => { isDrawing = false; });

boardElement.addEventListener('mouseover', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell) return;

    const selectedScope = document.querySelector('input[name="scope"]:checked').value;
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('hover-highlight'));
    
    if (selectedScope === 'room') {
        const roomId = cell.dataset.roomId;
        document.querySelectorAll(`.cell[data-room-id="${roomId}"]`).forEach(c => c.classList.add('hover-highlight'));
    } else {
        cell.classList.add('hover-highlight');
    }

    if (isDrawing && selectedScope === 'cell') {
        applyToolToCell(cell);
    }
});

boardElement.addEventListener('mouseleave', () => {
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('hover-highlight'));
});

function saveState() {
    const state = {};
    document.querySelectorAll('.cell').forEach(cell => {
        const cellState = {};
        ['b', 'n', 'e', 'm'].forEach(h => {
            const row = cell.querySelector(`.hero-row[data-hero="${h}"]`);
            const activeSearches = [];
            if (row.querySelector('.ind-treasure').classList.contains('active')) activeSearches.push('t');
            if (row.querySelector('.ind-trap').classList.contains('active')) activeSearches.push('r');
            if (row.querySelector('.ind-secret').classList.contains('active')) activeSearches.push('s');
            
            if (activeSearches.length > 0) {
                cellState[h] = activeSearches;
            }
        });
        if (Object.keys(cellState).length > 0) {
            state[cell.id] = cellState;
        }
    });
    localStorage.setItem('heroquestMatrixMapState', JSON.stringify(state));
}

function loadState() {
    const savedData = localStorage.getItem('heroquestMatrixMapState');
    if (savedData) {
        const state = JSON.parse(savedData);
        for (const [cellId, cellState] of Object.entries(state)) {
            const cell = document.getElementById(cellId);
            if (cell) {
                for (const [h, activeSearches] of Object.entries(cellState)) {
                    const row = cell.querySelector(`.hero-row[data-hero="${h}"]`);
                    if (row) {
                        if (activeSearches.includes('t')) row.querySelector('.ind-treasure').classList.add('active');
                        if (activeSearches.includes('r')) row.querySelector('.ind-trap').classList.add('active');
                        if (activeSearches.includes('s')) row.querySelector('.ind-secret').classList.add('active');
                    }
                }
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', loadState);

function resetBoard() {
    if (confirm("Ripulire completamente il registro? Tutti i dati di ricerca degli eroi andranno perduti.")) {
        document.querySelectorAll('.indicator').forEach(ind => ind.classList.remove('active'));
        document.getElementById('scope-room').checked = true;
        document.getElementById('hero-b').checked = true;
        document.getElementById('tool-treasure').checked = true;
        document.getElementById('mode-add').checked = true;
        localStorage.removeItem('heroquestMatrixMapState');
    }
}

// ==========================================
// LOGICA ARMERIA NARRATIVA (CON FILTRO E LOG)
// ==========================================
function generaAttacco(tipoAzione) {
    let eroeSelect = document.getElementById("eroe");
    let mostroSelect = document.getElementById("mostro");
    let tipoAttaccoSelect = document.getElementById("tipo-attacco");
    
    let eroe = eroeSelect.value;
    let mostro = mostroSelect.value;
    let tipoAttacco = tipoAttaccoSelect.value; // mischia, distanza o magia
    let risultatoDiv = document.getElementById("risultato");
    let cronologiaList = document.getElementById("cronologia-list");
    let lista = [];

    // Prima di generare la nuova frase, salviamo quella vecchia nella cronologia (se valida)
    let vecchiaFrase = risultatoDiv.innerText;
    if (vecchiaFrase && vecchiaFrase !== "Il fato attende il tiro dei dadi..." && !vecchiaFrase.startsWith("Nessuna descrizione")) {
        // Rimuove il messaggio di lista vuota al primo evento
        const emptyLi = cronologiaList.querySelector('.empty-log');
        if (emptyLi) emptyLi.remove();

        // Crea il nuovo elemento della cronologia
        let li = document.createElement("li");
        li.innerHTML = vecchiaFrase;
        
        // Lo inserisce in cima alla lista
        cronologiaList.insertBefore(li, cronologiaList.firstChild);

        // Mantiene solo gli ultimi 4 combattimenti per non allungare troppo la pagina
        if (cronologiaList.children.length > 4) {
            cronologiaList.removeChild(cronologiaList.lastChild);
        }
    }

    // Estrazione dell'entità o del sotto-ramo corretto
    let nodoAzione = databaseFrasi[tipoAzione];
    if (!nodoAzione) return;

    if (tipoAzione === 'eroe_colpisce' || tipoAzione === 'eroe_manca') {
        let nodoEroe = nodoAzione[eroe];
        if (nodoEroe && nodoEroe[mostro]) {
            let bersaglio = nodoEroe[mostro];
            // Controllo intelligente: se il bersaglio contiene il tipo di attacco, usa quello, altrimenti fa il fallback
            if (!Array.isArray(bersaglio) && bersaglio[tipoAttacco]) {
                lista = bersaglio[tipoAttacco];
            } else {
                lista = Array.isArray(bersaglio) ? bersaglio : [];
            }
        }
    } else if (tipoAzione === 'mostro_colpisce' || tipoAzione === 'mostro_manca') {
        let bersaglio = nodoAzione[mostro];
        if (!Array.isArray(bersaglio) && bersaglio[tipoAttacco]) {
            lista = bersaglio[tipoAttacco];
        } else {
            lista = Array.isArray(bersaglio) ? bersaglio : [];
        }
    }

    // Se la lista è vuota (manca la combinazione in data.js)
    if (lista.length === 0) {
        risultatoDiv.innerHTML = "<em>Nessuna descrizione trovata per questa combinazione...</em>";
        return;
    }

    let indice = Math.floor(Math.random() * lista.length);
    risultatoDiv.style.opacity = 0;
    
    // Animazione di dissolvenza prima di mostrare la nuova descrizione
    setTimeout(function() {
        // Recupera le emoji dei selettori per creare un'etichetta descrittiva
        let eroeEmoji = eroeSelect.options[eroeSelect.selectedIndex].text.split(" ")[0];
        let mostroEmoji = mostroSelect.options[mostroSelect.selectedIndex].text.split(" ")[0];
        let attaccoEmoji = tipoAttaccoSelect.options[tipoAttaccoSelect.selectedIndex].text.split(" ")[0];
        
        // Formatta la stringa finale con un tag per il log futuro
        risultatoDiv.innerHTML = `<span>[${eroeEmoji} ${attaccoEmoji} vs ${mostroEmoji}]</span> <strong>${lista[indice]}</strong>`;
        risultatoDiv.style.opacity = 1;
    }, 200);
}