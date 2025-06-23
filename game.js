// Game state
let blocks = 0;
let currentEquation = { num1: 0, num2: 0, answer: 0 };
const colors = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6'];

// DOM elements
const equationEl = document.getElementById('equation');
const answerInput = document.getElementById('answer-input');
const submitBtn = document.getElementById('submit-btn');
const blockCountEl = document.getElementById('block-count');
const blocksContainer = document.getElementById('blocks-container');
const cityCanvas = document.getElementById('city-canvas');

// Initialize game
function initGame() {
    generateNewEquation();
    setupEventListeners();
}

// Generate random math problem
function generateNewEquation() {
    currentEquation.num1 = Math.floor(Math.random() * 10) + 1;
    currentEquation.num2 = Math.floor(Math.random() * 10) + 1;
    currentEquation.answer = currentEquation.num1 + currentEquation.num2;
    
    equationEl.textContent = `${currentEquation.num1} + ${currentEquation.num2} = ?`;
    answerInput.value = '';
    answerInput.focus();
}

// Check player's answer
function checkAnswer() {
    const playerAnswer = parseInt(answerInput.value);
    
    if (playerAnswer === currentEquation.answer) {
        // Correct answer - reward blocks
        blocks += currentEquation.answer;
        blockCountEl.textContent = blocks;
        createNewBlocks(currentEquation.answer);
        generateNewEquation();
    } else {
        // Wrong answer
        alert('Try again!');
        answerInput.value = '';
        answerInput.focus();
    }
}

// Create visual blocks as rewards
function createNewBlocks(count) {
    for (let i = 0; i < count; i++) {
        const block = document.createElement('div');
        block.className = 'block';
        block.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        block.draggable = true;
        
        // Add drag events
        block.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', block.style.backgroundColor);
            setTimeout(() => block.style.opacity = '0.4', 0);
        });
        
        block.addEventListener('dragend', () => {
            block.style.opacity = '1';
        });
        
        blocksContainer.appendChild(block);
    }
}

// Set up drag and drop for building area
function setupEventListeners() {
    submitBtn.addEventListener('click', checkAnswer);
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });
    
    // Building area drop zone
    cityCanvas.addEventListener('dragover', (e) => {
        e.preventDefault();
        cityCanvas.style.backgroundColor = '#d5f5e3';
    });
    
    cityCanvas.addEventListener('dragleave', () => {
        cityCanvas.style.backgroundColor = '#ecf0f1';
    });
    
    cityCanvas.addEventListener('drop', (e) => {
        e.preventDefault();
        cityCanvas.style.backgroundColor = '#ecf0f1';
        
        const color = e.dataTransfer.getData('text/plain');
        const block = document.createElement('div');
        block.className = 'block';
        block.style.backgroundColor = color;
        block.style.position = 'absolute';
        block.style.left = `${e.clientX - cityCanvas.getBoundingClientRect().left - 25}px`;
        block.style.top = `${e.clientY - cityCanvas.getBoundingClientRect().top - 25}px`;
        
        cityCanvas.appendChild(block);
    });
}

// Start the game
initGame();