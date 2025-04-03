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
    ]
};

// DOM elements
const introScreen = document.getElementById('intro-screen');
const gameScreen = document.getElementById('game-screen');
const ctaScreen = document.getElementById('cta-screen');
const introProgress = document.getElementById('intro-progress');
const tubesContainer = document.getElementById('tubes-container');
const moveCount = document.getElementById('move-count');
const downloadBtn = document.getElementById('download-btn');

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initGame();
});

function initGame() {
    // Start with intro sequence
    startIntroSequence();
    
    // Set up event listeners
    setupEventListeners();
}

function startIntroSequence() {
    // Auto-play intro sequence (10 seconds)
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
    
    // Allow user to skip intro
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
    
    // Load current level with slight shuffle
    loadLevelWithChallenge();
    
    // Start game timer (15 seconds of gameplay)
    setTimeout(() => {
        endGameplay();
    }, 15000);
}

function loadLevelWithChallenge() {
    // Clear previous tubes
    tubesContainer.innerHTML = '';
    
    // Create a slightly shuffled version of the solution
    const shuffledTubes = JSON.parse(JSON.stringify(gameState.solution));
    
    // Lightly shuffle 2-3 cubes between tubes
    const shuffleCount = Math.floor(Math.random() * 2) + 2; // 2 or 3
    
    for (let i = 0; i < shuffleCount; i++) {
        // Find non-empty tubes
        const nonEmptyTubes = shuffledTubes.filter(tube => tube.length > 0);
        if (nonEmptyTubes.length < 2) break;
        
        // Pick two different tubes
        const tube1Index = Math.floor(Math.random() * nonEmptyTubes.length);
        let tube2Index;
        do {
            tube2Index = Math.floor(Math.random() * nonEmptyTubes.length);
        } while (tube2Index === tube1Index);
        
        // Move the top cube from tube1 to tube2
        const tube1 = nonEmptyTubes[tube1Index];
        const tube2 = nonEmptyTubes[tube2Index];
        const cube = tube1.pop();
        tube2.push(cube);
    }
    
    // Create tubes with the shuffled cubes
    shuffledTubes.forEach((tubeColors, index) => {
        const tube = document.createElement('div');
        tube.className = 'tube';
        tube.id = `tube-${index}`;
        
        // Add balls to tube with image backgrounds
        tubeColors.forEach(imgPath => {
            const ball = document.createElement('div');
            ball.className = 'ball';
            ball.style.backgroundImage = `url('${imgPath}')`;
            ball.draggable = true;
            tube.appendChild(ball);
        });
        
        tubesContainer.appendChild(tube);
    });
    
    // Set up drag and drop
    setupDragAndDrop();
}

function setupDragAndDrop() {
    const balls = document.querySelectorAll('.ball');
    const tubes = document.querySelectorAll('.tube');
    
    balls.forEach(ball => {
        ball.addEventListener('dragstart', function(e) {
            gameState.draggedBall = this;
            setTimeout(() => {
                this.classList.add('dragging');
            }, 0);
            gameState.sounds.click.play();
        });
        
        ball.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            gameState.draggedBall = null;
        });
    });
    
    tubes.forEach(tube => {
        tube.addEventListener('dragover', function(e) {
            e.preventDefault();
        });
        
        tube.addEventListener('dragenter', function(e) {
            e.preventDefault();
            if (this.children.length < 4) {
                this.style.transform = 'translateY(-5px)';
            }
        });
        
        tube.addEventListener('dragleave', function() {
            this.style.transform = 'translateY(0)';
        });
        
        tube.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.transform = 'translateY(0)';
            
            if (gameState.draggedBall && this.children.length < 4) {
                // Allow any cube to be placed on any other cube
                this.appendChild(gameState.draggedBall);
                gameState.moves++;
                moveCount.textContent = gameState.moves;
                gameState.sounds.pop.play();
                
                // Check for win condition
                if (checkWinCondition()) {
                    showWinMessage();
                }
            }
        });
    });
}

function checkWinCondition() {
    const tubes = document.querySelectorAll('.tube');
    
    // Check each tube meets the win conditions
    for (let i = 0; i < tubes.length; i++) {
        const balls = tubes[i].querySelectorAll('.ball');
        
        // Check if tube is empty (allowed in solution)
        if (balls.length === 0) {
            continue;
        }
        
        // Get the first ball's image as reference
        const firstBallImage = balls[0].style.backgroundImage;
        
        // Check all balls in tube have same image as first ball
        for (let j = 1; j < balls.length; j++) {
            if (balls[j].style.backgroundImage !== firstBallImage) {
                return false;
            }
        }
    }
    
    return true;
}

function showWinMessage() {
    gameState.sounds.win.play();
    
    // Create win message overlay
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
    
    // Set up download button
    downloadBtn.addEventListener('click', function() {
        // In a real ad, this would redirect to app store
        // alert('Redirecting to app store...');
        window.location.href = 'https://play.google.com/store/apps/details?id=games.burny.color.sort.woody.puzzle&hl=en-US';
    });
}

function setupEventListeners() {
    // Prevent default drag behaviors
    document.addEventListener('dragover', function(e) {
        e.preventDefault();
    });
    
    document.addEventListener('drop', function(e) {
        e.preventDefault();
    });
}
