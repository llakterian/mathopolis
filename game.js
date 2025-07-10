// Game state
let blocks = 0;
let buildingsBuilt = 0;
let currentEquation = { num1: 0, num2: 0, operation: '+', answer: 0 };
let isDaytime = true;
let currentDifficulty = 0;
let correctAnswersCount = 0;
let buildingHistory = []; // Array to store building history for undo
const MAX_HISTORY_STEPS = 7; // Maximum undo steps
let draggedBlock = null;
let offsetX, offsetY;

// Game difficulty levels - Updated with more gradual progression
const difficultyLevels = [
    { 
        name: "Beginner", 
        operations: ['+'], 
        maxNumber: 5,
        blocksPerPoint: 1,
        specialBlockChance: 0.05,
        minBuildings: 0
    },
    { 
        name: "Easy", 
        operations: ['+'], 
        maxNumber: 10,
        blocksPerPoint: 1.2,
        specialBlockChance: 0.07,
        minBuildings: 5
    },
    { 
        name: "Medium", 
        operations: ['+', '-'], 
        maxNumber: 15,
        blocksPerPoint: 1.5,
        specialBlockChance: 0.1,
        minBuildings: 15
    },
    { 
        name: "Hard", 
        operations: ['+', '-', '×'], 
        maxNumber: 20,
        blocksPerPoint: 1.8,
        specialBlockChance: 0.15,
        minBuildings: 30
    },
    { 
        name: "Expert", 
        operations: ['+', '-', '×', '÷'], 
        maxNumber: 30,
        blocksPerPoint: 2,
        specialBlockChance: 0.2,
        minBuildings: 50
    },
    { 
        name: "Master", 
        operations: ['+', '-', '×', '÷'], 
        maxNumber: 50,
        blocksPerPoint: 2.5,
        specialBlockChance: 0.25,
        minBuildings: 80
    }
];

// Colors and special blocks
const colors = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6'];
const specialBlocks = {
    rainbow: { 
        color: 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)', 
        points: 10,
        emoji: '🌈'
    },
    gold: { 
        color: 'gold', 
        points: 5,
        emoji: '🌟'
    },
    diamond: { 
        color: 'cyan', 
        points: 3,
        emoji: '💎'
    }
};

// Unlockable characters
const characters = [
    { name: "Color Fairy", unlocked: true, emoji: "🧚", desc: "Helps with colors!" },
    { name: "Math Wizard", unlocked: false, emoji: "🧙", requirement: 50, desc: "Makes math easier!" },
    { name: "Block Robot", unlocked: false, emoji: "🤖", requirement: 100, desc: "Builds faster!" },
    { name: "Rainbow Unicorn", unlocked: false, emoji: "🦄", requirement: 200, desc: "Magical builder!" }
];

// DOM elements
const equationEl = document.getElementById('equation');
const answerInput = document.getElementById('answer-input');
const submitBtn = document.getElementById('submit-btn');
const blockCountEl = document.getElementById('block-count');
const blocksContainer = document.getElementById('blocks-container');
const cityCanvas = document.getElementById('city-canvas');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const difficultyLevelEl = document.getElementById('difficulty-level');
const minigameBtn = document.getElementById('minigame-btn');
const unlockedCharactersEl = document.getElementById('unlocked-characters');
const professorImg = document.getElementById('professor');
const speechBubble = document.getElementById('speech-bubble');
const undoBtn = document.getElementById('undo-btn');

// Initialize game
function initGame() {
    generateNewEquation();
    setupEventListeners();
    updateProgress();
    startDayNightCycle();
    showMessage("Welcome to Mathopolis! Solve math problems to build your city!");
    updateDifficultyDisplay();
}

// Update difficulty display
function updateDifficultyDisplay() {
    difficultyLevelEl.textContent = `Level: ${difficultyLevels[currentDifficulty].name}`;
}

// Generate random math problem based on current difficulty
function generateNewEquation() {
    const difficulty = difficultyLevels[currentDifficulty];
    const operation = difficulty.operations[
        Math.floor(Math.random() * difficulty.operations.length)
    ];
    
    let num1, num2, answer;
    
    // Scale numbers based on buildings built for progressive difficulty
    const difficultyScale = Math.min(2, 1 + (buildingsBuilt / 100));
    
    switch(operation) {
        case '+':
            num1 = Math.floor(Math.random() * difficulty.maxNumber * difficultyScale) + 1;
            num2 = Math.floor(Math.random() * difficulty.maxNumber * difficultyScale) + 1;
            answer = num1 + num2;
            break;
        case '-':
            num1 = Math.floor(Math.random() * difficulty.maxNumber * difficultyScale) + 10;
            num2 = Math.floor(Math.random() * num1) + 1;
            answer = num1 - num2;
            break;
        case '×':
            num1 = Math.floor(Math.random() * 10 * difficultyScale) + 1;
            num2 = Math.floor(Math.random() * 10 * difficultyScale) + 1;
            answer = num1 * num2;
            break;
        case '÷':
            answer = Math.floor(Math.random() * 10 * difficultyScale) + 1;
            num2 = Math.floor(Math.random() * 5 * difficultyScale) + 1;
            num1 = answer * num2;
            break;
    }
    
    currentEquation = { num1, num2, operation, answer };
    
    // Display the equation with proper symbol
    const displayOperation = operation === '×' ? '×' : 
                           operation === '÷' ? '÷' : operation;
    equationEl.innerHTML = `${num1} ${displayOperation} ${num2} = ?`;
    answerInput.value = '';
    answerInput.focus();
}

// Check player's answer
function checkAnswer() {
    const playerAnswer = parseInt(answerInput.value);
    
    if (playerAnswer === currentEquation.answer) {
        // Correct answer
        playCorrectSound();
        correctAnswersCount++;
        
        // Calculate blocks based on difficulty
        const difficulty = difficultyLevels[currentDifficulty];
        const blocksEarned = Math.max(1, 
            Math.floor(currentEquation.answer * difficulty.blocksPerPoint)
        );
        
        blocks += blocksEarned;
        blockCountEl.textContent = blocks;
        
        // Create proportional blocks (limited to 10 visual blocks)
        createNewBlocks(blocksEarned);
        
        // Check for difficulty increase based on both correct answers and buildings built
        if ((correctAnswersCount >= 5 || buildingsBuilt >= difficultyLevels[currentDifficulty].minBuildings) && 
            currentDifficulty < difficultyLevels.length - 1) {
            currentDifficulty++;
            correctAnswersCount = 0;
            showMessage(`Level up! Now at ${difficultyLevels[currentDifficulty].name} difficulty!`);
            updateDifficultyDisplay();
        }
        
        celebrate();
        generateNewEquation();
        checkUnlocks();
        updateProgress();
        
        // Random professor comment
        const comments = [
            "Great job!",
            `You earned ${blocksEarned} blocks!`,
            "Math genius!",
            "Keep it up!"
        ];
        showMessage(comments[Math.floor(Math.random() * comments.length)]);
    } else {
        // Wrong answer
        showMessage("Oops! Try again!");
        answerInput.value = '';
        answerInput.focus();
    }
}

// Create visual blocks as rewards (limited to 10 visual blocks)
function createNewBlocks(count) {
    const visualBlocks = Math.min(count, 10);
    const difficulty = difficultyLevels[currentDifficulty];
    
    for (let i = 0; i < visualBlocks; i++) {
        if (Math.random() < difficulty.specialBlockChance) {
            const specialTypes = Object.keys(specialBlocks);
            const specialType = specialTypes[Math.floor(Math.random() * specialTypes.length)];
            createBlock(
                specialBlocks[specialType].color, 
                Math.ceil(specialBlocks[specialType].points * (currentDifficulty + 1)),
                specialBlocks[specialType].emoji
            );
        } else {
            createBlock(
                colors[Math.floor(Math.random() * colors.length)], 
                1,
                '⬜'
            );
        }
    }
}

// Create a single block
function createBlock(color, value, emoji) {
    const block = document.createElement('div');
    block.className = 'block';
    block.style.background = color;
    block.dataset.value = value;
    block.innerHTML = emoji;
    block.draggable = true;
    
    // Add drag events
    block.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', block.style.backgroundColor);
        e.dataTransfer.setData('value', block.dataset.value);
        setTimeout(() => block.style.opacity = '0.4', 0);
    });
    
    block.addEventListener('dragend', () => {
        block.style.opacity = '1';
    });
    
    blocksContainer.appendChild(block);
}

// Undo last building action
function undoLastAction() {
    if (buildingHistory.length === 0) {
        showMessage("Nothing to undo!");
        return;
    }
    
    const lastAction = buildingHistory.pop();
    const blocksToRestore = lastAction.value;
    
    // Remove the last placed block from city canvas
    if (lastAction.element && lastAction.element.parentNode === cityCanvas) {
        cityCanvas.removeChild(lastAction.element);
    }
    
    // Restore blocks to inventory
    blocks += blocksToRestore;
    blockCountEl.textContent = blocks;
    buildingsBuilt = Math.max(0, buildingsBuilt - blocksToRestore);
    updateProgress();
    
    showMessage(`Undo successful! ${blocksToRestore} blocks restored.`);
    playBuildSound();
}

// Enhanced drag and drop setup for building area
function setupEventListeners() {
    // Math answer submission
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
        cityCanvas.style.backgroundColor = isDaytime ? '#ecf0f1' : '#2c3e50';
    });
    
    cityCanvas.addEventListener('drop', (e) => {
        e.preventDefault();
        cityCanvas.style.backgroundColor = isDaytime ? '#ecf0f1' : '#2c3e50';
        
        const color = e.dataTransfer.getData('text/plain');
        const value = parseInt(e.dataTransfer.getData('value'));
        
        const block = document.createElement('div');
        block.className = 'city-block';
        block.style.background = color;
        block.style.position = 'absolute';
        block.style.left = `${e.clientX - cityCanvas.getBoundingClientRect().left - 25}px`;
        block.style.top = `${e.clientY - cityCanvas.getBoundingClientRect().top - 25}px`;
        block.draggable = true;
        block.dataset.value = value;
        
        // Add drag events for placed blocks
        block.addEventListener('dragstart', (e) => {
            draggedBlock = block;
            const rect = block.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            setTimeout(() => block.style.opacity = '0.4', 0);
        });
        
        block.addEventListener('dragend', () => {
            block.style.opacity = '1';
            draggedBlock = null;
        });
        
        cityCanvas.appendChild(block);
        playBuildSound();
        buildingsBuilt += value;
        
        // Add to history for undo functionality
        buildingHistory.push({ element: block, value: value });
        if (buildingHistory.length > MAX_HISTORY_STEPS) {
            buildingHistory.shift(); // Remove oldest action if we exceed max steps
        }
        
        updateProgress();
    });
    
    // Enable dragging placed blocks around the canvas
    cityCanvas.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (draggedBlock) {
            draggedBlock.style.left = `${e.clientX - cityCanvas.getBoundingClientRect().left - offsetX}px`;
            draggedBlock.style.top = `${e.clientY - cityCanvas.getBoundingClientRect().top - offsetY}px`;
        }
    });
    
    // Mini-game button
    minigameBtn.addEventListener('click', startMiniGame);
    
    // Undo button
    undoBtn.addEventListener('click', undoLastAction);
    
    // Building templates
    document.querySelectorAll('.template').forEach(template => {
        template.addEventListener('click', () => {
            const requiredBlocks = parseInt(template.dataset.blocks);
            if (blocks >= requiredBlocks) {
                blocks -= requiredBlocks;
                blockCountEl.textContent = blocks;
                showMessage(`Building a ${template.dataset.shape}...`);
                setTimeout(() => {
                    playBuildSound();
                    buildingsBuilt += requiredBlocks;
                    
                    // Add to history for undo functionality
                    buildingHistory.push({ value: requiredBlocks });
                    if (buildingHistory.length > MAX_HISTORY_STEPS) {
                        buildingHistory.shift();
                    }
                    
                    updateProgress();
                }, 1000);
            } else {
                showMessage(`You need ${requiredBlocks - blocks} more blocks!`);
            }
        });
    });
}

// Rest of the functions remain the same...
// (Mini-game, celebration, progress tracking, character unlocks, etc.)