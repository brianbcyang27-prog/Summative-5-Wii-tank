let gameStatus = 0;

// Feature globals
let walls = [];
let enemies = [];
let bullets = [];
let barrelAngle = 0;
const TANK_SIZE = 30;
const BULLET_SPEED = 6;
const CELL_SIZE = 40;
const PLAYER_SPEED = 200; // pixels per second
let gridCols = 0;
let gridRows = 0;
let keys = {};

// AABB collision check
function rectsOverlap(r1, r2) {
    return !(r2.left >= r1.right || r2.right <= r1.left ||
             r2.top >= r1.bottom || r2.bottom <= r1.top);
}

// Check if a rectangle overlaps any wall
function isPositionBlocked(x, y, w, h) {
    const testRect = { left: x, top: y, right: x + w, bottom: y + h };
    for (let wall of walls) {
        const wr = wall.getBoundingClientRect();
        if (rectsOverlap(testRect, wr)) return true;
    }
    return false;
}

function gameStart() {
    if (gameStatus == 0) {
        alert("welcome to the tank game! use the W,S,A,D keys to move and mouse to shoot. good luck!");
        gameStatus = "running";
        console.log("Game started! gameStatus : ", gameStatus);
        
        document.getElementById("introTitle").style.display = "none";
        document.getElementById("gameInfoBg").style.display = "none";
        document.getElementById("gameStartButton").style.display = "none";
        
        document.body.style.backgroundBlendMode = "color";
        document.body.style.backgroundColor = "rgb(235, 202, 106)";
        

        //TANK body
        const tank = document.createElement("div");
        tank.id = "playertank";
        tank.style.width = "30px";
        tank.style.height = "30px";
        tank.style.background = "green";
        tank.style.position = "absolute";
        tank.style.left = "300px";
        tank.style.top = "300px";
        document.body.appendChild(tank);

        // BARREL
        const barrel = document.createElement("div");

        barrel.style.width = "30px";
        barrel.style.height = "8px";
        barrel.style.background = "black";
        barrel.style.position = "absolute";

        barrel.style.left = "15px";
        barrel.style.top = "12.5px";

        barrel.style.transformOrigin = "0% 50%";

        tank.appendChild(barrel);


        // ROTATE TOWARD MOUSE
        document.addEventListener("mousemove", (e) => {

            const tankX = tank.offsetLeft + 15;
            const tankY = tank.offsetTop + 15;

            const dx = e.clientX - tankX;
            const dy = e.clientY - tankY;

            barrelAngle = Math.atan2(dy, dx) * 180 / Math.PI;

            barrel.style.transform = `rotate(${barrelAngle}deg)`;
        });

    }
}

function generateWalls() {

    walls = [];

    gridCols = Math.floor(window.innerWidth / CELL_SIZE);
    gridRows = Math.floor(window.innerHeight / CELL_SIZE);

    // Initialize grid: 0 = empty, 1 = wall
    let grid = [];
    for (let y = 0; y < gridRows; y++) {
        grid[y] = [];
        for (let x = 0; x < gridCols; x++) {
            grid[y][x] = (x === 0 || x === gridCols - 1 || y === 0 || y === gridRows - 1) ? 1 : 0;
        }
    }

    // Fill ~20% of interior cells as random walls
    const interiorCols = gridCols - 2;
    const interiorRows = gridRows - 2;
    const wallCount = Math.floor(interiorCols * interiorRows * 0.2);

    for (let i = 0; i < wallCount; i++) {
        const x = 1 + Math.floor(Math.random() * interiorCols);
        const y = 1 + Math.floor(Math.random() * interiorRows);
        if (grid[y] && grid[y][x] === 0) {
            grid[y][x] = 1;
        }
    }

    // Create wall elements from grid
    for (let y = 0; y < gridRows; y++) {
        for (let x = 0; x < gridCols; x++) {
            if (grid[y][x] === 1) {
                const wall = document.createElement("div");
                wall.style.position = "absolute";
                wall.style.background = "black";
                wall.style.left = (x * CELL_SIZE) + 'px';
                wall.style.top = (y * CELL_SIZE) + 'px';
                wall.style.width = CELL_SIZE + 'px';
                wall.style.height = CELL_SIZE + 'px';
                document.body.appendChild(wall);
                walls.push(wall);
            }
        }
    }

    console.log(`Walls generated! Grid: ${gridCols}x${gridRows}, Wall count: ${walls.length}`);

    // Ensure tank isn't stuck inside a wall
    const tank = document.getElementById('playertank');
    if (tank) {
        const tl = parseInt(tank.style.left);
        const tt = parseInt(tank.style.top);
        if (isPositionBlocked(tl, tt, TANK_SIZE, TANK_SIZE)) {
            for (let y = 1; y < gridRows - 1; y++) {
                for (let x = 1; x < gridCols - 1; x++) {
                    const cx = x * CELL_SIZE;
                    const cy = y * CELL_SIZE;
                    if (!isPositionBlocked(cx, cy, TANK_SIZE, TANK_SIZE)) {
                        tank.style.left = cx + 'px';
                        tank.style.top = cy + 'px';
                        console.log(`Tank repositioned to clear cell (${x}, ${y})`);
                        return;
                    }
                }
            }
        }
    }
}

function updatePlayer(dt) {

    const tank = document.getElementById('playertank');
    if (!tank) return;

    let left = parseInt(tank.style.left);
    let top = parseInt(tank.style.top);

    // Read key flags into direction vector
    let dx = 0, dy = 0;
    if (keys['w'] || keys['W']) dy = -1;
    if (keys['s'] || keys['S']) dy = 1;
    if (keys['a'] || keys['A']) dx = -1;
    if (keys['d'] || keys['D']) dx = 1;

    // Normalize diagonal so it's not faster
    if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
    }

    const moveX = dx * PLAYER_SPEED * dt;
    const moveY = dy * PLAYER_SPEED * dt;

    let newLeft = left + moveX;
    let newTop = top + moveY;

    // Clamp to playable area (inside grid border walls)
    const maxLeft = gridCols * CELL_SIZE - CELL_SIZE - TANK_SIZE;
    const maxTop = gridRows * CELL_SIZE - CELL_SIZE - TANK_SIZE;
    newLeft = Math.max(CELL_SIZE, Math.min(newLeft, maxLeft));
    newTop = Math.max(CELL_SIZE, Math.min(newTop, maxTop));

    // Check wall collisions — allow sliding along walls
    if (isPositionBlocked(newLeft, newTop, TANK_SIZE, TANK_SIZE)) {
        if (!isPositionBlocked(newLeft, top, TANK_SIZE, TANK_SIZE)) {
            newTop = top;
        } else if (!isPositionBlocked(left, newTop, TANK_SIZE, TANK_SIZE)) {
            newLeft = left;
        } else {
            newLeft = left;
            newTop = top;
        }
    }

    tank.style.left = newLeft + 'px';
    tank.style.top = newTop + 'px';
}

function spawnEnemies() {
    for (let i = 0; i < 5; i++) {
        const enemy = document.createElement("div");
        enemy.className = "enemy";
        enemy.style.width = TANK_SIZE + "px";
        enemy.style.height = TANK_SIZE + "px";
        enemy.style.background = "red";
        enemy.style.position = "absolute";
        enemy.style.borderRadius = "4px";

        let x, y, attempts = 0;
        const gridBoundX = gridCols * CELL_SIZE - CELL_SIZE - TANK_SIZE;
        const gridBoundY = gridRows * CELL_SIZE - CELL_SIZE - TANK_SIZE;
        do {
            x = Math.random() * (gridBoundX - CELL_SIZE) + CELL_SIZE;
            y = Math.random() * (gridBoundY - CELL_SIZE) + CELL_SIZE;
            attempts++;
        } while (isPositionBlocked(x, y, TANK_SIZE, TANK_SIZE) && attempts < 100);

        enemy.style.left = x + 'px';
        enemy.style.top = y + 'px';
        document.body.appendChild(enemy);
        enemies.push(enemy);
    }
}

function shoot() {
    if (gameStatus !== "running") return;

    const tank = document.getElementById('playertank');
    if (!tank) return;

    const tankCenterX = tank.offsetLeft + TANK_SIZE / 2;
    const tankCenterY = tank.offsetTop + TANK_SIZE / 2;
    const angleRad = barrelAngle * Math.PI / 180;

    const bullet = document.createElement("div");
    bullet.style.width = "8px";
    bullet.style.height = "8px";
    bullet.style.background = "yellow";
    bullet.style.borderRadius = "50%";
    bullet.style.position = "absolute";
    bullet.style.zIndex = "2";

    // Start bullet at barrel tip (barrel width = 30px)
    const startX = tankCenterX + Math.cos(angleRad) * 30 - 4;
    const startY = tankCenterY + Math.sin(angleRad) * 30 - 4;
    bullet.style.left = startX + 'px';
    bullet.style.top = startY + 'px';

    bullet.dx = Math.cos(angleRad) * BULLET_SPEED;
    bullet.dy = Math.sin(angleRad) * BULLET_SPEED;

    document.body.appendChild(bullet);
    bullets.push(bullet);
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        let x = parseFloat(b.style.left);
        let y = parseFloat(b.style.top);
        x += b.dx;
        y += b.dy;
        b.style.left = x + 'px';
        b.style.top = y + 'px';

        const bRect = b.getBoundingClientRect();
        let hit = false;

        // Wall collision
        for (let wall of walls) {
            const wRect = wall.getBoundingClientRect();
            if (rectsOverlap(bRect, wRect)) {
                hit = true;
                break;
            }
        }

        // Enemy collision
        if (!hit) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const eRect = enemies[j].getBoundingClientRect();
                if (rectsOverlap(bRect, eRect)) {
                    enemies[j].remove();
                    enemies.splice(j, 1);
                    hit = true;
                    break;
                }
            }
        }

        // Off-screen
        if (x < -10 || x > window.innerWidth + 10 || y < -10 || y > window.innerHeight + 10) {
            hit = true;
        }

        if (hit) {
            b.remove();
            bullets.splice(i, 1);
        }
    }

    // Win check
    if (enemies.length === 0 && gameStatus === "running") {
        gameStatus = "won";
        const winMsg = document.createElement("div");
        winMsg.id = "gameWin";
        winMsg.textContent = "You destroyed all enemies!";
        winMsg.style.cssText = `
            position: absolute; z-index: 10; left: 50%; top: 40%;
            transform: translate(-50%, -50%);
            color: white; font-family: Arial; font-size: 48px;
            text-align: center; background: rgba(0,0,0,0.7);
            padding: 40px; border-radius: 20px;
        `;
        document.body.appendChild(winMsg);

        const restartBtn = document.createElement("button");
        restartBtn.id = "restartButton";
        restartBtn.textContent = "restart";
        restartBtn.style.cssText = `
            position: absolute; z-index: 10; left: 50%; top: 60%;
            transform: translate(-50%, -50%);
            width: 200px; font-size: 50px; padding: 10px 20px;
            border-radius: 20px; cursor: pointer;
        `;
        restartBtn.addEventListener("click", () => location.reload());
        document.body.appendChild(restartBtn);
    }
}

let lastTime = 0;

function gameLoop(time) {
    if (lastTime === 0) lastTime = time;
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    if (gameStatus === "running") {
        updateBullets();
        updatePlayer(dt);
    }
    requestAnimationFrame(gameLoop);
}

// --- Event wiring ---

document.getElementById("gameStartButton").addEventListener("click", () => {
    gameStart();
    generateWalls();
    spawnEnemies();
    gameLoop();
});

document.addEventListener("keydown", (event) => {
    keys[event.key] = true;
});

document.addEventListener("keyup", (event) => {
    keys[event.key] = false;
});

document.addEventListener("click", (e) => {
    // Shoot on click, but not if clicking the start button
    if (e.target.id !== "gameStartButton") {
        shoot();
    }
});