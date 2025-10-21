const gameContainer = document.getElementById('game-container');
const dino = document.getElementById('dino');
const scoreDisplay = document.getElementById('score-display');
const messageBox = document.getElementById('message-box');
const groundHeight = 10; // Must match .ground height in style.css
const dinoBottom = groundHeight; // Dino rests on the ground

// --- Game State Variables ---
let score = 0;
let isJumping = false;
let isRunning = false;
let isGameOver = true;
let velocityY = 0;
const gravity = 0.6;
const jumpForce = 12;
let obstacleGenerationRate = 1800; // ms between obstacles (starts slow)
let gameSpeed = 4; // pixels per frame (starts slow)
let lastTime = 0;
let obstacleTimer = 0;

// Variables for consistent score increase
let scoreTimer = 0;
const SCORE_INTERVAL = 100; // Increase score every 100ms

// Dino dimensions (for collision calculation)
const DINO_WIDTH = 40; 
const DINO_HEIGHT = 50; 
const DINO_LEFT = 20;

// --- Game Logic Functions ---

function startGame() {
    if (!isGameOver) return;
    
    // Reset state
    score = 0;
    isJumping = false;
    isGameOver = false;
    gameSpeed = 4;
    obstacleGenerationRate = 1800;
    obstacleTimer = 0;
    scoreTimer = 0; // Reset score timer
    scoreDisplay.textContent = 'Score: 0';
    messageBox.style.display = 'none';

    // Remove all existing obstacles
    document.querySelectorAll('.obstacle').forEach(obs => obs.remove());

    // Start running animation
    dino.classList.add('running');
    isRunning = true;

    // Start the main loop
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function gameLoop(currentTime) {
    if (isGameOver) return;

    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // 1. Handle Score Increment
    scoreTimer += deltaTime;
    if (scoreTimer >= SCORE_INTERVAL) {
        score += 1; // Fixed increment
        scoreDisplay.textContent = `Score: ${score}`;
        scoreTimer -= SCORE_INTERVAL; // Reset by subtracting the interval for better timing accuracy
    }
    
    // Adjust difficulty based on score
    if (score % 500 < 10 && score > 0) {
        // Every 500 points, slightly increase speed and generation rate
        gameSpeed = Math.min(10, 4 + Math.floor(score / 500) * 0.5); 
        obstacleGenerationRate = Math.max(800, 1800 - Math.floor(score / 500) * 200);
    }

    // 2. Handle Jumping/Gravity
    if (isJumping) {
        // Calculate the new bottom position
        let dinoPos = parseFloat(dino.style.bottom || dinoBottom) + velocityY;
        dino.style.bottom = `${dinoPos}px`;
        velocityY -= gravity; // Apply gravity
        
        // Land the dino
        if (dinoPos <= dinoBottom) {
            dino.style.bottom = `${dinoBottom}px`;
            isJumping = false;
            velocityY = 0;
            dino.classList.add('running'); // Resume running animation
        }
    }

    // 3. Generate Obstacles
    obstacleTimer += deltaTime;
    if (obstacleTimer >= obstacleGenerationRate) {
        createObstacle();
        obstacleTimer = 0;
    }

    // 4. Move Obstacles & Check Collision
    document.querySelectorAll('.obstacle').forEach(obstacle => {
        let currentPos = parseFloat(obstacle.style.right);
        currentPos += gameSpeed; // Move left (by increasing right property)
        obstacle.style.right = `${currentPos}px`;
        
        // Check if obstacle is off screen
        if (currentPos > gameContainer.clientWidth) {
            obstacle.remove();
            return; // Stop processing this obstacle
        }

        // Collision Detection (AABB) using bounding box rectangles
        const dinoRect = dino.getBoundingClientRect();
        const obsRect = obstacle.getBoundingClientRect();

        // Check for overlap
        if (
            dinoRect.left < obsRect.right &&
            dinoRect.right > obsRect.left &&
            dinoRect.top < obsRect.bottom &&
            dinoRect.bottom > obsRect.top
        ) {
            endGame();
        }
    });

    // Request next frame for smooth animation
    requestAnimationFrame(gameLoop);
}

function createObstacle() {
    const obstacle = document.createElement('div');
    obstacle.classList.add('obstacle');

    // Simple pixel cactus (green block)
    const width = 15 + Math.random() * 10; // 15-25px
    const height = 30 + Math.random() * 20; // 30-50px
    obstacle.style.width = `${width}px`;
    obstacle.style.height = `${height}px`;
    obstacle.style.right = '0px';
    obstacle.style.backgroundColor = '#007000';

    gameContainer.appendChild(obstacle);
}



function jump() {
    if (isGameOver || isJumping) return;

    isJumping = true;
    velocityY = jumpForce;
    dino.classList.remove('running'); // Stop running animation while jumping
}

// Global function exposed to the button click
function resetGame() {
    // Remove game over color and reset to ground position
    dino.style.color = '#404040'; // Reset dino SVG color
    dino.style.bottom = `${dinoBottom}px`;
    startGame();
}

function endGame() {
    isGameOver = true;
    isRunning = false;
    dino.classList.remove('running');
    dino.style.color = '#d90429'; // Change dino SVG color to red on death
    
    messageBox.innerHTML = `
        GAME OVER! <br> 
        Final Score: ${score} <br>
        <span class="text-xl">Press RESTART below</span>
    `;
    messageBox.style.display = 'block';

    console.log(`Game Over. Final Score: ${score}`);
}


// --- Input Handlers ---

// Keyboard Input
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (isGameOver) {
            startGame();
        } else {
            jump();
        }
    }
});

// Touch Input (for mobile)
gameContainer.addEventListener('touchstart', (e) => {
    // Check if touch target is outside a button to prevent double action
    if (e.target.id === 'dino' || e.target.id === 'game-container') {
        e.preventDefault();
        if (isGameOver) {
            startGame();
        } else {
            jump();
        }
    }
});

// Initial setup on load
window.onload = () => {
     // Set initial position
    dino.style.bottom = `${dinoBottom}px`;
    console.log('Dino Runner Initialized. Press SPACE or Tap to start!');
};
