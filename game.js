// Game state
let blocks = 0;
let buildingsBuilt = 0;
let currentEquation = { num1: 0, num2: 0, operation: '+', answer: 0 };
let isDaytime = true;
let currentDifficulty = 0;
let correctAnswersCount = 0;
let buildingHistory = []; // Array to store building history for undo
const MAX_HISTORY_STEPS = 7; // Maximum undo steps

// Game difficulty levels
const difficultyLevels = [
    { 
        name: "Easy", 
        operations: ['+'], 
        maxNumber: 10,
        blocksPerPoint: 1,
        specialBlockChance: 0.05
    },
    { 
        name: "Medium", 
        operations: ['+', '-'], 
        maxNumber: 20,
        blocksPerPoint: 1.5,
        specialBlockChance: 0.1
    },
    { 
        name: "Hard", 
        operations: ['+', '-', '×'], 
        maxNumber: 30,
        blocksPerPoint: 2,
        specialBlockChance: 0.15
    },
    { 
        name: "Expert", 
        operations: ['+', '-', '×', '÷'], 
        maxNumber: 50,
        blocksPerPoint: 2.5,
        specialBlockChance: 0.2
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
    
    switch(operation) {
        case '+':
            num1 = Math.floor(Math.random() * difficulty.maxNumber) + 1;
            num2 = Math.floor(Math.random() * difficulty.maxNumber) + 1;
            answer = num1 + num2;
            break;
        case '-':
            num1 = Math.floor(Math.random() * difficulty.maxNumber) + 10;
            num2 = Math.floor(Math.random() * num1) + 1;
            answer = num1 - num2;
            break;
        case '×':
            num1 = Math.floor(Math.random() * 10) + 1;
            num2 = Math.floor(Math.random() * 10) + 1;
            answer = num1 * num2;
            break;
        case '÷':
            answer = Math.floor(Math.random() * 10) + 1;
            num2 = Math.floor(Math.random() * 5) + 1;
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
        
        // Check for difficulty increase
        if (correctAnswersCount >= 5 && currentDifficulty < difficultyLevels.length - 1) {
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

// Set up drag and drop for building area
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
        block.className = 'block';
        block.style.background = color;
        block.style.position = 'absolute';
        block.style.left = `${e.clientX - cityCanvas.getBoundingClientRect().left - 25}px`;
        block.style.top = `${e.clientY - cityCanvas.getBoundingClientRect().top - 25}px`;
        
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

// Mini-game: Color Challenge
function startMiniGame() {
    const targetColor = colors[Math.floor(Math.random() * colors.length)];
    const colorName = getColorName(targetColor);
    
    showMessage(`Quick! What color is this? ${colorName.toUpperCase()}!`, 3000);
    
    // Flash the color
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100vw';
    flash.style.height = '100vh';
    flash.style.backgroundColor = targetColor;
    flash.style.zIndex = '999';
    flash.style.opacity = '0.7';
    flash.style.transition = 'opacity 1s';
    document.body.appendChild(flash);
    
    setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), 1000);
        
        // Reward for paying attention
        blocks += 5;
        blockCountEl.textContent = blocks;
        showMessage(`Good memory! You earned 5 blocks!`);
        playCorrectSound();
    }, 2000);
}

function getColorName(hex) {
    const colors = {
        '#e74c3c': 'red',
        '#3498db': 'blue',
        '#f1c40f': 'yellow',
        '#2ecc71': 'green',
        '#9b59b6': 'purple'
    };
    return colors[hex];
}

// Celebration effects
function celebrate() {
    // Confetti effect
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 2000);
        }, i * 50);
    }
}

// Progress tracking
function updateProgress() {
    const progress = Math.min(100, Math.floor(buildingsBuilt / 2));
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${progress}% Built`;
    
    if (progress === 100) {
        showMessage("Congratulations! You've built Mathopolis!");
    }
}

// Character unlocks
function checkUnlocks() {
    characters.forEach(char => {
        if (!char.unlocked && blocks >= char.requirement) {
            char.unlocked = true;
            showUnlockMessage(char);
            updateUnlockedCharacters();
        }
    });
}

function showUnlockMessage(character) {
    document.getElementById('unlock-sound').play();
    
    const message = document.createElement('div');
    message.className = 'unlock-message';
    message.innerHTML = `✨ Unlocked ${character.emoji} ${character.name}!<br><small>${character.desc}</small>`;
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 3000);
}

function updateUnlockedCharacters() {
    unlockedCharactersEl.innerHTML = '<h4>Your Helpers:</h4>';
    characters.filter(c => c.unlocked).forEach(char => {
        const charEl = document.createElement('div');
        charEl.innerHTML = `${char.emoji} ${char.name}`;
        unlockedCharactersEl.appendChild(charEl);
    });
}

// Day/Night cycle
function startDayNightCycle() {
    setInterval(() => {
        isDaytime = !isDaytime;
        document.body.classList.toggle('night-mode', !isDaytime);
        cityCanvas.style.backgroundColor = isDaytime ? '#ecf0f1' : '#2c3e50';
        
        // Change professor's appearance
        professorImg.src = isDaytime 
            ? 'https://i.imgur.com/WQZ5JzG.png' 
            : 'https://i.imgur.com/8Q3JzK9.png';
            
        showMessage(isDaytime ? "Good morning! Time to build!" : "It's nighttime! Keep building!");
    }, 30000);
}

// Professor messages
function showMessage(text, duration = 2000) {
    speechBubble.textContent = text;
    setTimeout(() => {
        if (speechBubble.textContent === text) {
            speechBubble.textContent = "Let's build Mathopolis!";
        }
    }, duration);
}

// Sound effects
function playCorrectSound() {
    const sound = document.getElementById('correct-sound');
    sound.currentTime = 0;
    sound.play();
}

function playBuildSound() {
    const sound = document.getElementById('build-sound');
    sound.currentTime = 0;
    sound.play();
}

// Start the game
initGame();