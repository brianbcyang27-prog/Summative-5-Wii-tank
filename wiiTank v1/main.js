let gameStatus = 0;

// Feature globals
let walls = [];
let enemies = [];
let bullets = [];
let barrelAngle = 0;
const TANK_SIZE = 30;
const BULLET_SPEED = 6;

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

function createWalls() {

    walls = [];

    const makeWall = (styles) => {
        const wall = document.createElement("div");
        wall.style.position = "absolute";
        wall.style.background = "black";
        Object.assign(wall.style, styles);
        document.body.appendChild(wall);
        walls.push(wall);
        return wall;
    };

    // TOP WALL
    makeWall({ top: "0", left: "0", width: "100%", height: "20px" });

    // BOTTOM WALL
    makeWall({ bottom: "0", left: "0", width: "100%", height: "20px" });

    // LEFT WALL
    makeWall({ top: "0", left: "0", width: "20px", height: "100%" });

    // RIGHT WALL
    makeWall({ top: "0", right: "0", width: "20px", height: "100%" });
}

function tankMovement(event) {

    const tank = document.getElementById('playertank');
    let left = parseInt(tank.style.left);
    let top = parseInt(tank.style.top);
    const speed = 20;

    // Compute desired new position
    let newLeft = left;
    let newTop = top;

    if (event.key == "w") newTop = top - speed;
    if (event.key == "s") newTop = top + speed;
    if (event.key == "a") newLeft = left - speed;
    if (event.key == "d") newLeft = left + speed;

    // Clamp to border walls (20px borders)
    newLeft = Math.max(20, Math.min(newLeft, window.innerWidth - TANK_SIZE - 20));
    newTop = Math.max(20, Math.min(newTop, window.innerHeight - TANK_SIZE - 20));

    // Check wall collisions — allow sliding along walls
    if (isPositionBlocked(newLeft, newTop, TANK_SIZE, TANK_SIZE)) {
        if (!isPositionBlocked(newLeft, top, TANK_SIZE, TANK_SIZE)) {
            // Can move horizontally only
            newTop = top;
        } else if (!isPositionBlocked(left, newTop, TANK_SIZE, TANK_SIZE)) {
            // Can move vertically only
            newLeft = left;
        } else {
            // Fully blocked
            newLeft = left;
            newTop = top;
        }
    }

    tank.style.left = newLeft + 'px';
    tank.style.top = newTop + 'px';
}

function createRandomWalls() {

    for(let i = 0; i < 50; i++){
        const wall = document.createElement("div");
        wall.style.position = "absolute";
        wall.style.width = "100px";
        wall.style.height = "20px";
        wall.style.background = "black";
        wall.id = "wall" + i;

        const randomX = Math.random() * (window.innerWidth - 140) + 20;
        const randomY = Math.random() * (window.innerHeight - 140) + 20;
        const randomRotation = Math.random() * 4;

        if(randomRotation < 1){
            wall.style.transform = `rotate(0deg)`;
        } else if(randomRotation < 2){
            wall.style.transform = `rotate(90deg)`;
        } else if(randomRotation < 3){
            wall.style.transform = `rotate(180deg)`;
        } else {
            wall.style.transform = `rotate(270deg)`;
        }

        wall.style.left = randomX + 'px';
        wall.style.top = randomY + 'px';

        document.body.appendChild(wall);
        walls.push(wall);
    }
    console.log("Random walls created!");
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
        do {
            x = Math.random() * (window.innerWidth - TANK_SIZE - 40) + 20;
            y = Math.random() * (window.innerHeight - TANK_SIZE - 40) + 20;
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

function gameLoop() {
    if (gameStatus === "running") {
        updateBullets();
    }
    requestAnimationFrame(gameLoop);
}

// --- Event wiring ---

document.getElementById("gameStartButton").addEventListener("click", () => {
    gameStart();
    createWalls();
    createRandomWalls();
    spawnEnemies();
    gameLoop();
});

document.addEventListener("keydown", (event) => {
    if (gameStatus === "running") {
        tankMovement(event);
    }
});

document.addEventListener("click", (e) => {
    // Shoot on click, but not if clicking the start button
    if (e.target.id !== "gameStartButton") {
        shoot();
    }
});