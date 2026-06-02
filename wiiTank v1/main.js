let gameStatus = 0;

// Feature globals
let walls = [];
let enemies = [];
let bullets = [];
let barrelAngle = 0;
const TANK_SIZE = 30;
const BULLET_SPEED = 6;
const ENEMY_BULLET_SPEED = 4;
const CELL_SIZE = 40;
const PLAYER_SPEED = 200; // pixels per second
const ENEMY_SPEED = 80; // pixels per second
const MAX_ENEMIES = 12;
const BASE_ROUND_TIME = 20;
const TIME_PER_ENEMY = 5;
const MIN_ROUND_TIME = 25;
const MAX_ROUND_TIME = 75;
const ENEMY_SHOOT_RANGE = 520;
const ENEMY_SHOOT_COOLDOWN_MIN = 1.4;
const ENEMY_SHOOT_COOLDOWN_MAX = 2.8;
let gridCols = 0;
let gridRows = 0;
let keys = {};

// Level / score / timer
let level = 1;
let score = 0;
let timeRemaining = 0;
let lastTime = 0;
let gameLoopRunning = false;

const LEVEL_THEMES = [
    "rgb(235, 202, 106)", // desert
    "rgb(85, 130, 85)",   // forest
    "rgb(70, 90, 140)",   // night blue
    "rgb(120, 80, 80)",   // wasteland
    "rgb(90, 70, 120)"    // purple zone
];

const WALL_THEMES = [
    "#2d2d2d",
    "#3b4d3b",
    "#394766",
    "#4d3b32",
    "#47345c"
];

function getThemeIndex(lvl) {
    return Math.floor((lvl - 1) / 3) % LEVEL_THEMES.length;
}

function updateBackgroundTheme(lvl) {
    const themeIndex = getThemeIndex(lvl);
    document.body.style.transition = "background-color 1s ease";
    document.body.style.backgroundColor = LEVEL_THEMES[themeIndex];
}


function getEnemyCount(lvl) {
    return Math.min(2 + lvl, MAX_ENEMIES);
}

function getRoundTime(lvl) {
    const enemyCount = getEnemyCount(lvl);
    const levelPressure = Math.floor((lvl - 1) / 3) * 2;
    return Math.max(MIN_ROUND_TIME, Math.min(MAX_ROUND_TIME, BASE_ROUND_TIME + enemyCount * TIME_PER_ENEMY - levelPressure));
}

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
        document.getElementById("introPanel").style.display = "none";
        
        document.body.style.backgroundBlendMode = "color";
        
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

function generateWalls(lvl) {

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

    // More walls per level: 18% + 2.5%/level, capped at 30%
    const density = Math.min(0.18 + (lvl - 1) * 0.025, 0.30);
    const interiorCols = gridCols - 2;
    const interiorRows = gridRows - 2;
    const wallCount = Math.floor(interiorCols * interiorRows * density);

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
                wall.style.background = WALL_THEMES[getThemeIndex(level)];
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
            // Scan outward from the grid center so the tank spawns in open space
            const centerCol = Math.floor(gridCols / 2);
            const centerRow = Math.floor(gridRows / 2);
            const maxRadius = Math.max(gridCols, gridRows);
            for (let r = 0; r < maxRadius; r++) {
                for (let dy = -r; dy <= r; dy++) {
                    for (let dx = -r; dx <= r; dx++) {
                        // Only check cells at the current ring radius
                        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
                        const x = centerCol + dx;
                        const y = centerRow + dy;
                        if (x < 1 || x >= gridCols - 1 || y < 1 || y >= gridRows - 1) continue;
                        const px = x * CELL_SIZE;
                        const py = y * CELL_SIZE;
                        if (!isPositionBlocked(px, py, TANK_SIZE, TANK_SIZE)) {
                            tank.style.left = px + 'px';
                            tank.style.top = py + 'px';
                            console.log(`Tank repositioned to clear cell (${x}, ${y})`);
                            return;
                        }
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

function spawnEnemies(lvl) {
    const count = getEnemyCount(lvl);
    for (let i = 0; i < count; i++) {
        const enemy = document.createElement("div");
        enemy.className = "enemy";
        enemy.style.width = TANK_SIZE + "px";
        enemy.style.height = TANK_SIZE + "px";
        enemy.style.background = "red";
        enemy.style.position = "absolute";

        const enemyBarrel = document.createElement("div");
        enemyBarrel.className = "enemy-barrel";
        enemyBarrel.style.width = "26px";
        enemyBarrel.style.height = "7px";
        enemyBarrel.style.background = "rgb(35, 10, 10)";
        enemyBarrel.style.position = "absolute";
        enemyBarrel.style.left = "15px";
        enemyBarrel.style.top = "11.5px";
        enemyBarrel.style.transformOrigin = "0% 50%";
        enemy.appendChild(enemyBarrel);
        enemy.barrel = enemyBarrel;

        enemy.moveX = 0;
        enemy.moveY = 0;
        enemy.changeDirectionTime = 0;
        enemy.shootCooldown = ENEMY_SHOOT_COOLDOWN_MIN + Math.random() * (ENEMY_SHOOT_COOLDOWN_MAX - ENEMY_SHOOT_COOLDOWN_MIN);

        setEnemyRandomDirection(enemy);

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

function setEnemyRandomDirection(enemy) {
    const angle = Math.random() * Math.PI * 2;
    enemy.moveX = Math.cos(angle);
    enemy.moveY = Math.sin(angle);
    enemy.changeDirectionTime = 0.7 + Math.random() * 1.6;
}


function hasLineOfSight(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.hypot(dx, dy);
    const steps = Math.ceil(distance / 12);

    for (let i = 1; i < steps; i++) {
        const x = x1 + (dx * i) / steps;
        const y = y1 + (dy * i) / steps;
        if (isPositionBlocked(x - 3, y - 3, 6, 6)) {
            return false;
        }
    }
    return true;
}

function createBullet(x, y, angleRad, owner) {
    const bullet = document.createElement("div");
    bullet.style.width = "10px";
    bullet.style.height = "10px";
    bullet.style.borderRadius = "50%";
    bullet.style.position = "absolute";
    bullet.style.zIndex = "3";
    bullet.style.left = (x - 5) + 'px';
    bullet.style.top = (y - 5) + 'px';
    bullet.owner = owner;

    if (owner === "enemy") {
        bullet.style.background = "rgb(255, 35, 35)";
        bullet.style.border = "2px solid white";
    } else {
        bullet.style.background = "rgb(20, 145, 255)";
        bullet.style.border = "2px solid white";
    }

    const speed = owner === "enemy" ? ENEMY_BULLET_SPEED : BULLET_SPEED;
    bullet.dx = Math.cos(angleRad) * speed;
    bullet.dy = Math.sin(angleRad) * speed;

    document.body.appendChild(bullet);
    bullets.push(bullet);
}

function enemyShootAtPlayer(enemy) {
    const tank = document.getElementById('playertank');
    if (!tank) return;

    const enemyCenterX = enemy.offsetLeft + TANK_SIZE / 2;
    const enemyCenterY = enemy.offsetTop + TANK_SIZE / 2;
    const tankCenterX = tank.offsetLeft + TANK_SIZE / 2;
    const tankCenterY = tank.offsetTop + TANK_SIZE / 2;
    const dx = tankCenterX - enemyCenterX;
    const dy = tankCenterY - enemyCenterY;
    const distance = Math.hypot(dx, dy);

    if (distance > ENEMY_SHOOT_RANGE) return;
    if (!hasLineOfSight(enemyCenterX, enemyCenterY, tankCenterX, tankCenterY)) return;

    const angleRad = Math.atan2(dy, dx);
    const startX = enemyCenterX + Math.cos(angleRad) * 22;
    const startY = enemyCenterY + Math.sin(angleRad) * 22;
    createBullet(startX, startY, angleRad, "enemy");
}

function updateEnemyAim(enemy) {
    const tank = document.getElementById('playertank');
    if (!tank || !enemy.barrel) return;

    const enemyCenterX = enemy.offsetLeft + TANK_SIZE / 2;
    const enemyCenterY = enemy.offsetTop + TANK_SIZE / 2;
    const tankCenterX = tank.offsetLeft + TANK_SIZE / 2;
    const tankCenterY = tank.offsetTop + TANK_SIZE / 2;
    const angleDeg = Math.atan2(tankCenterY - enemyCenterY, tankCenterX - enemyCenterX) * 180 / Math.PI;

    enemy.barrel.style.transform = `rotate(${angleDeg}deg)`;
}

function updateEnemies(dt) {
    for (let enemy of enemies) {
        updateEnemyAim(enemy);
        enemy.changeDirectionTime -= dt;
        if (enemy.changeDirectionTime <= 0) {
            setEnemyRandomDirection(enemy);
        }

        const left = parseFloat(enemy.style.left);
        const top = parseFloat(enemy.style.top);
        let newLeft = left + enemy.moveX * ENEMY_SPEED * dt;
        let newTop = top + enemy.moveY * ENEMY_SPEED * dt;

        const maxLeft = gridCols * CELL_SIZE - CELL_SIZE - TANK_SIZE;
        const maxTop = gridRows * CELL_SIZE - CELL_SIZE - TANK_SIZE;
        newLeft = Math.max(CELL_SIZE, Math.min(newLeft, maxLeft));
        newTop = Math.max(CELL_SIZE, Math.min(newTop, maxTop));

        if (isPositionBlocked(newLeft, newTop, TANK_SIZE, TANK_SIZE)) {
            if (!isPositionBlocked(newLeft, top, TANK_SIZE, TANK_SIZE)) {
                newTop = top;
                enemy.moveY *= -1;
            } else if (!isPositionBlocked(left, newTop, TANK_SIZE, TANK_SIZE)) {
                newLeft = left;
                enemy.moveX *= -1;
            } else {
                newLeft = left;
                newTop = top;
                setEnemyRandomDirection(enemy);
            }
        }

        enemy.style.left = newLeft + 'px';
        enemy.style.top = newTop + 'px';

        enemy.shootCooldown -= dt;
        if (enemy.shootCooldown <= 0) {
            enemyShootAtPlayer(enemy);
            enemy.shootCooldown = ENEMY_SHOOT_COOLDOWN_MIN + Math.random() * (ENEMY_SHOOT_COOLDOWN_MAX - ENEMY_SHOOT_COOLDOWN_MIN);
        }
    }
}

function shoot() {
    if (gameStatus !== "running") return;

    const tank = document.getElementById('playertank');
    if (!tank) return;

    const tankCenterX = tank.offsetLeft + TANK_SIZE / 2;
    const tankCenterY = tank.offsetTop + TANK_SIZE / 2;
    const angleRad = barrelAngle * Math.PI / 180;

    // Start bullet at barrel tip (barrel width = 30px)
    const startX = tankCenterX + Math.cos(angleRad) * 30;
    const startY = tankCenterY + Math.sin(angleRad) * 30;
    createBullet(startX, startY, angleRad, "player");
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

        // Player bullets can destroy enemies.
        if (!hit && b.owner === "player") {
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

        // Enemy bullets end the round if they hit the player.
        if (!hit && b.owner === "enemy") {
            const tank = document.getElementById('playertank');
            if (tank && rectsOverlap(bRect, tank.getBoundingClientRect())) {
                hit = true;
                gameOver("SHOT DOWN");
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

    // Level complete — all enemies destroyed
    if (enemies.length === 0 && gameStatus === "running") {
        gameStatus = "levelComplete";
        levelComplete();
    }
}

// ==================== HUD ====================

function createHUD() {
    document.getElementById('hudLevel')?.remove();
    document.getElementById('hudScore')?.remove();
    document.getElementById('hudTimer')?.remove();

    const style = 'position:fixed;top:10px;color:white;font-family:Arial;font-size:22px;z-index:100;pointer-events:none;';

    const lvl = document.createElement('div');
    lvl.id = 'hudLevel'; lvl.style.cssText = style + 'left:20px;';
    document.body.appendChild(lvl);

    const scr = document.createElement('div');
    scr.id = 'hudScore'; scr.style.cssText = style + 'left:50%;transform:translateX(-50%);';
    document.body.appendChild(scr);

    const tmr = document.createElement('div');
    tmr.id = 'hudTimer'; tmr.style.cssText = style + 'right:20px;';
    document.body.appendChild(tmr);

    updateHUD();
}

function updateHUD() {
    const lvlEl = document.getElementById('hudLevel');
    const scrEl = document.getElementById('hudScore');
    const tmrEl = document.getElementById('hudTimer');

    if (lvlEl) lvlEl.textContent = `Level ${level}`;
    if (scrEl) scrEl.textContent = `Score: ${score}`;

    if (tmrEl) {
        const t = Math.ceil(timeRemaining);
        tmrEl.textContent = `Time: ${t}s`;
        tmrEl.style.color = t <= 10 ? '#e74c3c' : 'white';
    }
}

// ==================== LEVEL SETUP ====================

function setUpLevel(lvl) {
    enemies.forEach(e => e.remove());
    bullets.forEach(b => b.remove());
    walls.forEach(w => w.remove());
    enemies = [];
    bullets = [];
    walls = [];

    const tank = document.getElementById('playertank');
    if (tank) {
        tank.style.left = Math.floor(window.innerWidth / 2) + 'px';
        tank.style.top = Math.floor(window.innerHeight / 2) + 'px';
    }

    gameStatus = "running";
    level = lvl;
    timeRemaining = getRoundTime(lvl);
    updateBackgroundTheme(lvl);

    generateWalls(lvl);
    spawnEnemies(lvl);
    updateHUD();

    // Start game loop once
    if (!gameLoopRunning) {
        gameLoopRunning = true;
        lastTime = 0;
        requestAnimationFrame(gameLoop);
    }
}

// ==================== LEVEL COMPLETE ====================

function levelComplete() {
    const bonus = Math.floor(timeRemaining) * 10;
    score += bonus;

    const msg = document.createElement('div');
    msg.style.cssText = `
        position:fixed;z-index:200;left:50%;top:45%;transform:translate(-50%,-50%);
        color:#27ae60;font-family:Arial;font-size:52px;font-weight:bold;
        text-align:center;text-shadow:0 0 30px #27ae60;
        background:rgba(0,0,0,0.6);padding:30px 50px;border-radius:16px;
        pointer-events:none;transition:opacity 0.5s;
    `;
    msg.innerHTML = `Level ${level} Clear!<br><span style="font-size:24px;color:#f39c12;">+${bonus} time bonus</span>`;
    document.body.appendChild(msg);

    setTimeout(() => {
        msg.style.opacity = '0';
        setTimeout(() => { msg.remove(); setUpLevel(level + 1); }, 500);
    }, 1500);
}

// ==================== GAME OVER ====================

function gameOver(title = "TIME\'S UP!") {
    gameStatus = "over";

    const ov = document.createElement('div');
    ov.id = 'gameOverScreen';
    ov.style.cssText = `
        position:fixed;z-index:300;left:0;top:0;width:100%;height:100%;
        background:rgba(0,0,0,0.8);display:flex;flex-direction:column;
        align-items:center;justify-content:center;
        font-family:Arial;color:white;
    `;
    ov.innerHTML = `
        <h1 style="color:#e74c3c;font-size:64px;margin:0;">${title}</h1>
        <p style="font-size:28px;margin:15px 0 5px;">Reached Level ${level}</p>
        <p style="font-size:32px;color:#f39c12;margin:5px 0 30px;">Final Score: ${score}</p>
        <button id="gameOverRestart" style="padding:15px 50px;font-size:24px;cursor:pointer;
            background:#e94560;border:none;border-radius:10px;color:white;">
            PLAY AGAIN
        </button>
    `;
    document.body.appendChild(ov);
    document.getElementById('gameOverRestart').addEventListener('click', () => location.reload());
}

// ==================== GAME LOOP ====================

function gameLoop(time) {
    if (lastTime === 0) lastTime = time;
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    if (gameStatus === "running") {
        timeRemaining -= dt;
        if (timeRemaining <= 0) {
            timeRemaining = 0;
            gameOver();
        }
        updateHUD();
        updateBullets();
        updateEnemies(dt);
        updatePlayer(dt);
    }
    requestAnimationFrame(gameLoop);
}

// ==================== EVENT WIRING ====================

document.getElementById("gameStartButton").addEventListener("click", () => {
    gameStart();
    createHUD();
    setUpLevel(1);
});

document.addEventListener("keydown", (event) => {
    keys[event.key] = true;
});

document.addEventListener("keyup", (event) => {
    keys[event.key] = false;
});

document.addEventListener("click", (e) => {
    if (e.target.id !== "gameStartButton" && e.target.id !== "gameOverRestart") {
        shoot();
    }
});
