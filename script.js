// Game state
const gameState = {
    level: 1,
    moves: 0,
    isPlaying: false,
    draggedBall: null,
    sounds: {
        pop: new Audio('https://assets.codepen.io/21542/howler-popp.mp3'),
        win: new Audio('https://assets.codepen.io/21542/howler-win-sound.mp3'),
        click: new Audio('https://assets.codepen.io/21542/howler-click.mp3')
    },
    solution: [
        ['assets/red.png', 'assets/red.png', 'assets/red.png'],
        ['assets/blue.png', 'assets/blue.png', 'assets/blue.png'],
        ['assets/green.png', 'assets/green.png', 'assets/green.png'],
        ['assets/orange.png', 'assets/orange.png', 'assets/orange.png'],
        []
    ],
    touchStartX: 0,
    touchStartY: 0
};

// DOM elements
const introScreen = document.getElementById('intro-screen');
const gameScreen = document.getElementById('game-screen');
const ctaScreen = document.getElementById('cta-screen');
const introProgress = document.getElementById('intro-progress');
const tubesContainer = document.getElementById('tubes-container');
const moveCount = document.getElementById('move-count');
const downloadBtn = document.getElementById('download-btn');

// Initialize game
document.addEventListener('DOMContentLoaded', function() {
    initGame();
});

function initGame() {
    startIntroSequence();
    setupEventListeners();
}

function startIntroSequence() {
    let progress = 100;
    const interval = setInterval(() => {
        progress -= 1;
        introProgress.style.width = `${progress}%`;
        
        if (progress <= 0) {
            clearInterval(interval);
            introScreen.style.opacity = '0';
            setTimeout(() => {
                introScreen.style.display = 'none';
                startGame();
            }, 1000);
        }
    }, 100);
    
    introScreen.addEventListener('click', function() {
        clearInterval(interval);
        introScreen.style.opacity = '0';
        setTimeout(() => {
            introScreen.style.display = 'none';
            startGame();
        }, 1000);
    });
}

function startGame() {
    gameScreen.style.display = 'flex';
    gameState.isPlaying = true;
    gameState.moves = 0;
    moveCount.textContent = '0';
    
    // Center the game area
    tubesContainer.style.margin = 'auto';
    tubesContainer.style.display = 'flex';
    tubesContainer.style.justifyContent = 'center';
    tubesContainer.style.alignItems = 'flex-end';
    
    loadLevelWithChallenge();
    
    setTimeout(() => {
        endGameplay();
    }, 15000);
}

function loadLevelWithChallenge() {
    tubesContainer.innerHTML = '';
    const shuffledTubes = JSON.parse(JSON.stringify(gameState.solution));
    
    // Lightly shuffle cubes
    const shuffleCount = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < shuffleCount; i++) {
        const nonEmptyTubes = shuffledTubes.filter(tube => tube.length > 0);
        if (nonEmptyTubes.length < 2) break;
        
        const tube1Index = Math.floor(Math.random() * nonEmptyTubes.length);
        let tube2Index;
        do {
            tube2Index = Math.floor(Math.random() * nonEmptyTubes.length);
        } while (tube2Index === tube1Index);
        
        const cube = nonEmptyTubes[tube1Index].pop();
        nonEmptyTubes[tube2Index].push(cube);
    }
    
    // Create tubes with image-based cubes
    shuffledTubes.forEach((tubeImages, index) => {
        const tube = document.createElement('div');
        tube.className = 'tube';
        tube.id = `tube-${index}`;
        
        tubeImages.forEach(imgPath => {
            const ball = document.createElement('div');
            ball.className = 'ball';
            ball.style.backgroundImage = `url('${imgPath}')`;
            ball.style.backgroundSize = 'contain';
            ball.style.backgroundRepeat = 'no-repeat';
            ball.style.backgroundPosition = 'center';
            tube.appendChild(ball);
        });
        
        tubesContainer.appendChild(tube);
    });
    
    setupDragAndDrop();
}

function setupDragAndDrop() {
    document.body.classList.add('game-active');
    const balls = document.querySelectorAll('.ball');
    const tubes = document.querySelectorAll('.tube');
    
    // Mouse events
    balls.forEach(ball => {
        ball.addEventListener('mousedown', handleDragStart);
        ball.addEventListener('touchstart', handleTouchStart, { passive: false });
    });
    
    tubes.forEach(tube => {
        tube.addEventListener('mouseup', handleDrop);
        tube.addEventListener('touchend', handleTouchDrop);
        tube.addEventListener('dragover', handleDragOver);
    });
    
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchend', handleDragEnd);
}

// Mouse event handlers
function handleDragStart(e) {
    e.preventDefault();
    gameState.draggedBall = this;
    this.classList.add('dragging');
    gameState.sounds.click.play();
}

function handleDragMove(e) {
    if (!gameState.draggedBall) return;
    
    const x = e.clientX - gameState.draggedBall.offsetWidth / 2;
    const y = e.clientY - gameState.draggedBall.offsetHeight / 2;
    
    gameState.draggedBall.style.position = 'absolute';
    gameState.draggedBall.style.left = `${x}px`;
    gameState.draggedBall.style.top = `${y}px`;
    gameState.draggedBall.style.zIndex = '1000';
}

function handleDragEnd() {
    if (!gameState.draggedBall) return;
    gameState.draggedBall.classList.remove('dragging');
    gameState.draggedBall.style.position = '';
    gameState.draggedBall.style.left = '';
    gameState.draggedBall.style.top = '';
    gameState.draggedBall.style.zIndex = '';
    gameState.draggedBall = null;
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    if (!gameState.draggedBall) return;
    
    const tube = e.currentTarget;
    if (tube.children.length < 4) {
        tube.appendChild(gameState.draggedBall);
        gameState.moves++;
        moveCount.textContent = gameState.moves;
        gameState.sounds.pop.play();
        
        if (checkWinCondition()) {
            showWinMessage();
        }
    }
}

// Touch event handlers
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    gameState.touchStartX = touch.clientX;
    gameState.touchStartY = touch.clientY;
    gameState.draggedBall = e.currentTarget;
    gameState.draggedBall.classList.add('dragging');
    gameState.sounds.click.play();
}

function handleTouchMove(e) {
    if (!gameState.draggedBall) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const x = touch.clientX - gameState.draggedBall.offsetWidth / 2;
    const y = touch.clientY - gameState.draggedBall.offsetHeight / 2;
    
    gameState.draggedBall.style.position = 'absolute';
    gameState.draggedBall.style.left = `${x}px`;
    gameState.draggedBall.style.top = `${y}px`;
    gameState.draggedBall.style.zIndex = '1000';
}

function handleTouchDrop(e) {
    if (!gameState.draggedBall) return;
    e.preventDefault();
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element && element.classList.contains('tube') && element.children.length < 4) {
        element.appendChild(gameState.draggedBall);
        gameState.moves++;
        moveCount.textContent = gameState.moves;
        gameState.sounds.pop.play();
        
        if (checkWinCondition()) {
            showWinMessage();
        }
    }
}

function checkWinCondition() {
    const tubes = document.querySelectorAll('.tube');
    
    for (const tube of tubes) {
        const balls = tube.querySelectorAll('.ball');
        if (balls.length > 0) {
            const firstImage = balls[0].style.backgroundImage;
            for (let i = 1; i < balls.length; i++) {
                if (balls[i].style.backgroundImage !== firstImage) {
                    return false;
                }
            }
        }
    }
    return true;
}

function showWinMessage() {
    gameState.sounds.win.play();
    
    const winOverlay = document.createElement('div');
    winOverlay.className = 'win-overlay';
    
    const winText = document.createElement('h2');
    winText.textContent = 'You Won!';
    
    const movesText = document.createElement('p');
    movesText.textContent = `Completed in ${gameState.moves} moves!`;
    
    const continueBtn = document.createElement('button');
    continueBtn.className = 'download-btn';
    continueBtn.textContent = 'Continue';
    continueBtn.addEventListener('click', function() {
        document.body.removeChild(winOverlay);
        endGameplay();
    });
    
    winOverlay.appendChild(winText);
    winOverlay.appendChild(movesText);
    winOverlay.appendChild(continueBtn);
    document.body.appendChild(winOverlay);
}

function endGameplay() {
    gameScreen.style.display = 'none';
    showCTAScreen();
}

function showCTAScreen() {
    ctaScreen.style.display = 'flex';
    downloadBtn.addEventListener('click', function() {
        alert('Redirecting to app store...');
        // window.location.href = 'https://play.google.com/store/apps/details?id=com.example.colorsort';
    });
}

function setupEventListeners() {
    document.addEventListener('dragover', function(e) {
        e.preventDefault();
    });
    
    document.addEventListener('drop', function(e) {
        e.preventDefault();
    });
}