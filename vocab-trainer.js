// Hier definieren wir das HTML-Layout und das CSS unserer Komponente.
// Die <template> sorgt dafür, dass der Browser diesen Code nicht sofort anzeigt,
// sondern als wiederverwendbare Vorlage bereithält.
const template = document.createElement('template');
template.innerHTML = `
    <style>
        /* CSS ist jetzt innerhalb der Komponente gekapselt. */
        /* :host bezieht sich auf das <vokabel-trainer>-Element selbst. */
        :host {
            font-family: sans-serif;
        }

        #vocab-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 20vw;
            min-width: 360px;
            min-height: 150px;
            background-color: #2b2b2b;
            color: #f5f5f5;
            border: 1px solid #444;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            padding: 20px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-sizing: border-box; 
        }
        
        /* Alle anderen CSS-Regeln bleiben gleich... */
        #prompt-word { font-size: 1.2em; font-weight: bold; margin: 0; }
        #solution-word { font-size: 1.1em; color: #64b5f6; margin-top: 10px; display: none; }
        .buttons { display: flex; justify-content: flex-end; align-items: center; gap: 10px; }
        .nav-btn { font-size: 1.2em; font-weight: bold; padding: 5px 12px; }
        .mode-btn.active { background-color: #64b5f6; color: #121212; }
        #vocab-counter { font-size: 0.9em; color: #a0a0a0; margin-left: 8px; }
        button { padding: 8px 12px; border: none; border-radius: 5px; cursor: pointer; background-color: #424242; color: white; font-size: 0.9em; transition: background-color 0.2s; }
        button:hover { background-color: #5a5a5a; }
    </style>

    <!-- Das ist das HTML-Layout der Komponente -->
    <div id="vocab-container">
        <div>
            <p id="prompt-word"></p>
            <p id="solution-word"></p>
        </div>
        <div class="buttons">
            <button id="random-mode-btn" class="mode-btn">🎲</button>
            <button id="list-mode-btn" class="mode-btn active">📋</button>
            <span id="vocab-counter"></span> 
            <div style="flex-grow: 1;"></div> 
            <button id="prev-btn" class="nav-btn">&lt;</button>
            <button id="next-btn" class="nav-btn">&gt;</button>
            <button id="solution-btn">Lösung</button>
        </div>
    </div>
`;


// Hier definieren wir die Logik unserer Komponente in einer Klasse.
class VocabTrainer extends HTMLElement {
    constructor() {
        super();
        // Erstelle ein "Shadow DOM". Das ist der Trick, der CSS und HTML kapselt.
        this.attachShadow({ mode: 'open' });
        // Hänge die HTML/CSS-Vorlage an das Shadow DOM an.
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        // Initialisiere die Vokabelliste und Zustandsvariablen
        this.vocabulary = [
            { fremdsprache: "estar acostumbrado/a", deutsch: "gewohnt sein (to be used to)" }, { fremdsprache: "la patineta", deutsch: "das Skateboard" }, { fremdsprache: "retroceder", deutsch: "zurückweichen, zurückgehen" }, { fremdsprache: "pegar", deutsch: "kleben" }, { fremdsprache: "la fragilidad", deutsch: "die Zerbrechlichkeit" }, { fremdsprache: "mensual", deutsch: "monatlich" }, { fremdsprache: "elocuente", deutsch: "eloquent" }
        ];
        this.currentMode = 'list';
        this.listIndex = 0;
        this.randomHistory = [];
        this.randomHistoryIndex = -1;
        this.globalViewCounter = 0;
    }

    // Diese Funktion wird vom Browser aufgerufen, sobald die Komponente in die Seite eingefügt wird.
    // Hier kommt unsere gesamte Logik hinein.
    connectedCallback() {
        // Elemente aus dem Shadow DOM holen (wichtig: this.shadowRoot verwenden)
        this.promptWordElement = this.shadowRoot.getElementById('prompt-word');
        this.solutionWordElement = this.shadowRoot.getElementById('solution-word');
        this.vocabCounterElement = this.shadowRoot.getElementById('vocab-counter');
        
        // Event Listeners hinzufügen
        this.shadowRoot.getElementById('solution-btn').addEventListener('click', () => this.solutionWordElement.style.display = 'block');
        this.shadowRoot.getElementById('prev-btn').addEventListener('click', () => this.navigate('prev'));
        this.shadowRoot.getElementById('next-btn').addEventListener('click', () => this.navigate('next'));
        this.shadowRoot.getElementById('list-mode-btn').addEventListener('click', () => this.setMode('list'));
        this.shadowRoot.getElementById('random-mode-btn').addEventListener('click', () => this.setMode('random'));
        
        // Initialer Start
        this.globalViewCounter = 1;
        this.updateActiveButton();
        this.displayVocab(this.listIndex);
    }
    
    // Die Logik wurde in Methoden der Klasse aufgeteilt, um sie sauberer zu halten.
    displayVocab(index) {
        if (index < 0 || index >= this.vocabulary.length) return;
        this.promptWordElement.textContent = this.vocabulary[index].deutsch;
        this.solutionWordElement.textContent = this.vocabulary[index].fremdsprache;
        this.solutionWordElement.style.display = 'none'; 
        this.updateCounter();
    }
    
    updateCounter() {
        this.vocabCounterElement.textContent = this.globalViewCounter;
    }
    
    navigate(direction) {
        if (direction === 'next') {
            this.globalViewCounter++;
            if (this.currentMode === 'list') {
                this.listIndex = (this.listIndex + 1) % this.vocabulary.length;
                this.displayVocab(this.listIndex);
            } else {
                if (this.randomHistoryIndex >= this.randomHistory.length - 1) { this.randomHistory = this.shuffleIndices(); this.randomHistoryIndex = -1; }
                this.randomHistoryIndex++;
                this.displayVocab(this.randomHistory[this.randomHistoryIndex]);
            }
        } else if (direction === 'prev') {
            if (this.currentMode === 'list') {
                this.listIndex = (this.listIndex - 1 + this.vocabulary.length) % this.vocabulary.length;
                this.displayVocab(this.listIndex);
            } else {
                if (this.randomHistoryIndex > 0) { this.randomHistoryIndex--; this.displayVocab(this.randomHistory[this.randomHistoryIndex]); }
            }
        }
    }
    
    setMode(mode) {
        if (this.currentMode === mode) return;
        this.currentMode = mode;
        this.updateActiveButton();
        
        if (mode === 'list') {
            this.displayVocab(this.listIndex);
        } else {
            this.globalViewCounter++;
            this.randomHistory = this.shuffleIndices();
            this.randomHistoryIndex = 0;
            this.displayVocab(this.randomHistory[this.randomHistoryIndex]);
        }
    }
    
    shuffleIndices() {
        const indices = Array.from(this.vocabulary.keys());
        for (let i = indices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [indices[i], indices[j]] = [indices[j], indices[i]]; }
        return indices;
    }

    updateActiveButton() {
        this.shadowRoot.getElementById('list-mode-btn').classList.toggle('active', this.currentMode === 'list');
        this.shadowRoot.getElementById('random-mode-btn').classList.toggle('active', this.currentMode === 'random');
    }
}

// Hier registrieren wir unseren neuen HTML-Tag beim Browser.
// Der erste Parameter ist der Name des Tags (muss einen Bindestrich enthalten).
// Der zweite Parameter ist die Klasse, die seine Logik definiert.
window.customElements.define('vokabel-trainer', VocabTrainer);
