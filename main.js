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
const BURST_ENEMY_SPEED = 45; // pixels per second
const MAX_ENEMIES = 12;
const BASE_ROUND_TIME = 20;
const TIME_PER_ENEMY = 5;
const MIN_ROUND_TIME = 25;
const MAX_ROUND_TIME = 75;
const ENEMY_SHOOT_RANGE = 520;
const ENEMY_SHOOT_COOLDOWN_MIN = 1.4;
const ENEMY_SHOOT_COOLDOWN_MAX = 2.8;
const BURST_ENEMY_LEVEL = 2;
const BURST_ENEMY_MAG_SIZE = 4;
const BURST_ENEMY_BURST_GAP = 0.16;
const BURST_ENEMY_RELOAD_TIME = 3.2;
const ARTILLERY_ENEMY_LEVEL = 4;
const ARTILLERY_ENEMY_SIZE = 44;
const ARTILLERY_ENEMY_SPEED = 18;
const ARTILLERY_ENEMY_RANGE_RATIO = 0.5;
const ARTILLERY_ENEMY_WINDUP_TIME = 1.5;
const ARTILLERY_ENEMY_FIRING_TIME = 0;
const ARTILLERY_ENEMY_COOLDOWN = 2.0;
const ARTILLERY_BULLET_SPEED = 5;
let gridCols = 0;
let gridRows = 0;
let keys = {};

// Level / score / timer
let level = 1;
let score = 0;
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

function shouldSpawnBurstEnemy(lvl, index) {
    if (lvl < BURST_ENEMY_LEVEL) return false;
    if (lvl === BURST_ENEMY_LEVEL && index === 0) return true;
    return Math.random() < 0.28;
}

function shouldSpawnArtilleryEnemy(lvl, index) {
    if (lvl < ARTILLERY_ENEMY_LEVEL) return false;
    if (lvl === ARTILLERY_ENEMY_LEVEL && index === 0) return true;
    return Math.random() < 0.18;
}

function createEnemy(type = "normal") {
    const enemy = document.createElement("div");
    enemy.className = type === "normal" ? "enemy" : `enemy ${type}-enemy`;
    enemy.enemyType = type;
    enemy.enemySize = type === "artillery" ? ARTILLERY_ENEMY_SIZE : TANK_SIZE;
    enemy.style.width = enemy.enemySize + "px";
    enemy.style.height = enemy.enemySize + "px";
    enemy.style.position = "absolute";

    if (type === "burst") {
        enemy.style.background = "rgb(145, 44, 185)";
        enemy.ammo = BURST_ENEMY_MAG_SIZE;
        enemy.reloadTimer = 0;
        enemy.burstTimer = 0;
    } else if (type === "artillery") {
        enemy.style.background = "rgb(128, 82, 42)";
        enemy.shootCooldown = 1.5;
        enemy.artilleryWindupTimer = 0;
        enemy.artilleryFiringTimer = 0;
    } else {
        enemy.style.background = "red";
    }

    if (type === "artillery") {
        const mortar = document.createElement("div");
        mortar.className = "artillery-mortar";
        mortar.style.width = "30px";
        mortar.style.height = "30px";
        mortar.style.borderRadius = "50%";
        mortar.style.background = "rgb(55, 35, 20)";
        mortar.style.border = "3px solid rgb(35, 20, 12)";
        mortar.style.position = "absolute";
        mortar.style.left = "7px";
        mortar.style.top = "7px";
        enemy.appendChild(mortar);
        enemy.barrel = mortar;
    } else {
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
    }

    enemy.moveX = 0;
    enemy.moveY = 0;
    enemy.changeDirectionTime = 0;
    if (type !== "artillery") {
        enemy.shootCooldown = ENEMY_SHOOT_COOLDOWN_MIN + Math.random() * (ENEMY_SHOOT_COOLDOWN_MAX - ENEMY_SHOOT_COOLDOWN_MIN);
    }
    setEnemyRandomDirection(enemy);
    return enemy;
}

function spawnEnemies(lvl) {
    const count = getEnemyCount(lvl);
    for (let i = 0; i < count; i++) {
        let enemyType = "normal";
        if (shouldSpawnArtilleryEnemy(lvl, i)) {
            enemyType = "artillery";
        } else if (shouldSpawnBurstEnemy(lvl, i)) {
            enemyType = "burst";
        }
        const enemy = createEnemy(enemyType);

        let x, y, attempts = 0;
        const enemySize = enemy.enemySize || TANK_SIZE;
        const gridBoundX = gridCols * CELL_SIZE - CELL_SIZE - enemySize;
        const gridBoundY = gridRows * CELL_SIZE - CELL_SIZE - enemySize;
        do {
            x = Math.random() * (gridBoundX - CELL_SIZE) + CELL_SIZE;
            y = Math.random() * (gridBoundY - CELL_SIZE) + CELL_SIZE;
            attempts++;
        } while (isPositionBlocked(x, y, enemySize, enemySize) && attempts < 100);

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

    if (owner === "artillery") {
        bullet.style.width = "30px";
        bullet.style.height = "30px";
        bullet.style.background = "rgb(85, 45, 20)";
        bullet.style.border = "3px solid rgb(235, 180, 100)";
        bullet.style.zIndex = "6";
    } else if (owner === "enemy") {
        bullet.style.background = "rgb(255, 35, 35)";
        bullet.style.border = "2px solid white";
    } else {
        bullet.style.background = "rgb(20, 145, 255)";
        bullet.style.border = "2px solid white";
    }

    const speed = owner === "artillery" ? ARTILLERY_BULLET_SPEED : (owner === "enemy" ? ENEMY_BULLET_SPEED : BULLET_SPEED);
    bullet.dx = Math.cos(angleRad) * speed;
    bullet.dy = Math.sin(angleRad) * speed;

    document.body.appendChild(bullet);
    bullets.push(bullet);
}

function getEnemyShotData(enemy, ignoreWalls = false) {
    const tank = document.getElementById('playertank');
    if (!tank) return null;

    const enemySize = enemy.enemySize || TANK_SIZE;
    const enemyCenterX = enemy.offsetLeft + enemySize / 2;
    const enemyCenterY = enemy.offsetTop + enemySize / 2;
    const tankCenterX = tank.offsetLeft + TANK_SIZE / 2;
    const tankCenterY = tank.offsetTop + TANK_SIZE / 2;
    const dx = tankCenterX - enemyCenterX;
    const dy = tankCenterY - enemyCenterY;
    const distance = Math.hypot(dx, dy);

    const range = enemy.enemyType === "artillery" ? Math.max(window.innerWidth, window.innerHeight) * ARTILLERY_ENEMY_RANGE_RATIO : ENEMY_SHOOT_RANGE;
    if (distance > range) return null;
    if (!ignoreWalls && !hasLineOfSight(enemyCenterX, enemyCenterY, tankCenterX, tankCenterY)) return null;

    const angleRad = Math.atan2(dy, dx);
    return {
        angleRad,
        startX: enemyCenterX + Math.cos(angleRad) * 22,
        startY: enemyCenterY + Math.sin(angleRad) * 22
    };
}

function enemyShootAtPlayer(enemy) {
    const shot = getEnemyShotData(enemy);
    if (!shot) return false;
    createBullet(shot.startX, shot.startY, shot.angleRad, "enemy");
    return true;
}

function updateBurstEnemyWeapon(enemy, dt) {
    if (enemy.reloadTimer > 0) {
        enemy.reloadTimer -= dt;
        if (enemy.reloadTimer <= 0) {
            enemy.ammo = BURST_ENEMY_MAG_SIZE;
            enemy.reloadTimer = 0;
            enemy.shootCooldown = 0.5;
        }
        return;
    }

    enemy.shootCooldown -= dt;
    if (enemy.shootCooldown > 0) return;

    const fired = enemyShootAtPlayer(enemy);
    if (fired) {
        enemy.ammo--;
        if (enemy.ammo <= 0) {
            enemy.reloadTimer = BURST_ENEMY_RELOAD_TIME;
            enemy.shootCooldown = BURST_ENEMY_RELOAD_TIME;
        } else {
            enemy.shootCooldown = BURST_ENEMY_BURST_GAP;
        }
    } else {
        enemy.shootCooldown = 0.35;
    }
}

function artilleryShootAtPlayer(enemy) {
    const shot = getEnemyShotData(enemy, true);
    if (!shot) return false;
    createBullet(shot.startX, shot.startY, shot.angleRad, "artillery");
    return true;
}

function updateArtilleryEnemyWeapon(enemy, dt) {
    if (enemy.artilleryFiringTimer > 0) {
        enemy.artilleryFiringTimer -= dt;
        return;
    }

    if (enemy.artilleryWindupTimer > 0) {
        enemy.artilleryWindupTimer -= dt;
        if (enemy.artilleryWindupTimer <= 0) {
            artilleryShootAtPlayer(enemy);
            enemy.artilleryFiringTimer = ARTILLERY_ENEMY_FIRING_TIME;
            enemy.shootCooldown = ARTILLERY_ENEMY_COOLDOWN;
        }
        return;
    }

    enemy.shootCooldown -= dt;
    if (enemy.shootCooldown <= 0) {
        const shot = getEnemyShotData(enemy, true);
        if (shot) {
            enemy.artilleryWindupTimer = ARTILLERY_ENEMY_WINDUP_TIME;
        } else {
            enemy.shootCooldown = 0.6;
        }
    }
}

function updateEnemyAim(enemy) {
    const tank = document.getElementById('playertank');
    if (!tank || !enemy.barrel) return;

    const enemySize = enemy.enemySize || TANK_SIZE;
    const enemyCenterX = enemy.offsetLeft + enemySize / 2;
    const enemyCenterY = enemy.offsetTop + enemySize / 2;
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
        let enemySpeed = ENEMY_SPEED;
        if (enemy.enemyType === "burst") enemySpeed = BURST_ENEMY_SPEED;
        if (enemy.enemyType === "artillery") enemySpeed = ARTILLERY_ENEMY_SPEED;
        const enemyIsLocked = enemy.enemyType === "artillery" && (enemy.artilleryWindupTimer > 0 || enemy.artilleryFiringTimer > 0);
        let newLeft = enemyIsLocked ? left : left + enemy.moveX * enemySpeed * dt;
        let newTop = enemyIsLocked ? top : top + enemy.moveY * enemySpeed * dt;

        const enemySize = enemy.enemySize || TANK_SIZE;
        const maxLeft = gridCols * CELL_SIZE - CELL_SIZE - enemySize;
        const maxTop = gridRows * CELL_SIZE - CELL_SIZE - enemySize;
        newLeft = Math.max(CELL_SIZE, Math.min(newLeft, maxLeft));
        newTop = Math.max(CELL_SIZE, Math.min(newTop, maxTop));

        if (isPositionBlocked(newLeft, newTop, enemySize, enemySize)) {
            if (!isPositionBlocked(newLeft, top, enemySize, enemySize)) {
                newTop = top;
                enemy.moveY *= -1;
            } else if (!isPositionBlocked(left, newTop, enemySize, enemySize)) {
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

        if (enemy.enemyType === "burst") {
            updateBurstEnemyWeapon(enemy, dt);
        } else if (enemy.enemyType === "artillery") {
            updateArtilleryEnemyWeapon(enemy, dt);
        } else {
            enemy.shootCooldown -= dt;
            if (enemy.shootCooldown <= 0) {
                enemyShootAtPlayer(enemy);
                enemy.shootCooldown = ENEMY_SHOOT_COOLDOWN_MIN + Math.random() * (ENEMY_SHOOT_COOLDOWN_MAX - ENEMY_SHOOT_COOLDOWN_MIN);
            }
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

        // Wall collision. Artillery shells fly over walls, so walls do not stop them.
        if (b.owner !== "artillery") {
            for (let wall of walls) {
                const wRect = wall.getBoundingClientRect();
                if (rectsOverlap(bRect, wRect)) {
                    hit = true;
                    break;
                }
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
        if (!hit && (b.owner === "enemy" || b.owner === "artillery")) {
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

    const style = 'position:fixed;top:10px;color:white;font-family:Arial;font-size:22px;z-index:100;pointer-events:none;';

    const lvl = document.createElement('div');
    lvl.id = 'hudLevel'; lvl.style.cssText = style + 'left:20px;';
    document.body.appendChild(lvl);

    const scr = document.createElement('div');
    scr.id = 'hudScore'; scr.style.cssText = style + 'left:50%;transform:translateX(-50%);';
    document.body.appendChild(scr);

    updateHUD();
}

function updateHUD() {
    const lvlEl = document.getElementById('hudLevel');
    const scrEl = document.getElementById('hudScore');
    if (lvlEl) lvlEl.textContent = `Level ${level}`;
    if (scrEl) scrEl.textContent = `Score: ${score}`;

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
    updateBackgroundTheme(lvl);

    generateWalls(lvl);
    spawnEnemies(lvl);
    updateHUD();
    showLevelIntro(lvl);

    // Start game loop once
    if (!gameLoopRunning) {
        gameLoopRunning = true;
        lastTime = 0;
        requestAnimationFrame(gameLoop);
    }
}


function showLevelIntro(lvl) {
    document.getElementById('levelIntroBox')?.remove();

    let introHTML = "";
    if (lvl === BURST_ENEMY_LEVEL) {
        introHTML = `
            <strong>New enemy: Burst Tank</strong><br>
            Slow movement. Saves ammo. Fires fast bursts. Reloads fully when empty.
        `;
    } else if (lvl === ARTILLERY_ENEMY_LEVEL) {
        introHTML = `
            <strong>New enemy: Artillery Tank</strong><br>
            Huge and extremely slow. Stops before firing. Its attacks fly over walls from long range.
        `;
    } else {
        return;
    }

    const box = document.createElement('div');
    box.id = 'levelIntroBox';
    box.innerHTML = introHTML;
    document.body.appendChild(box);

    setTimeout(() => {
        box.classList.add('fade-out');
        setTimeout(() => box.remove(), 900);
    }, 4200);
}

// ==================== LEVEL COMPLETE ====================

function levelComplete() {
    const bonus = level * 100;
    score += bonus;

    const msg = document.createElement('div');
    msg.style.cssText = `
        position:fixed;z-index:200;left:50%;top:45%;transform:translate(-50%,-50%);
        color:#27ae60;font-family:Arial;font-size:52px;font-weight:bold;
        text-align:center;text-shadow:0 0 30px #27ae60;
        background:rgba(0,0,0,0.6);padding:30px 50px;border-radius:16px;
        pointer-events:none;transition:opacity 0.5s;
    `;
    msg.innerHTML = `Level ${level} Clear!<br><span style="font-size:24px;color:#f39c12;">+${bonus} bonus score</span>`;
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