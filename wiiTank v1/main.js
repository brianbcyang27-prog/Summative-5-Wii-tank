const gameStart = document.getElementById("gameStartButton");

function gameStart() {
    alert("welcome to the tank game! use the arrow keys to move and space to shoot. good luck!");
    gameStartButton.style.display = "none";
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");
    let x = 250;
    let y = 250;
    let speed = 5;
    let bullets = [];
    let enemies = [];
    let enemySpeed = 2;
    let score = 0;

    function drawTank() {
        ctx.fillStyle = "green";
        ctx.fillRect(x, y, 50, 50);
    }

    function drawBullets() {
        ctx.fillStyle = "black";
        bullets.forEach(bullet => {
            ctx.fillRect(bullet.x, bullet.y, 5, 5);
        });
    }

    function drawEnemies() {
        ctx.fillStyle = "red";
        enemies.forEach(enemy => {
            ctx.fillRect(enemy.x, enemy.y, 50, 50);
        });
    }

    function moveBullets() {
        bullets.forEach((bullet, index) => {
            bullet.y -= 10;
            if (bullet.y < 0) {
                bullets.splice(index, 1);
            }
        });
    }

    function moveEnemies() {
        enemies.forEach(enemy => {
            enemy.y += enemySpeed;
        });
    }

    function spawnEnemies() {
        if (Math.random() < 0.02) {
            enemies.push({ x: Math.random() * 450, y: -50 });
        }
    }

    function checkCollisions() {
        bullets.forEach((bullet, bIndex) => {
            enemies.forEach((enemy, eIndex) => {
                if (bullet.x < enemy.x + 50 &&
                    bullet.x + 5 > enemy.x &&
                    bullet.y < enemy.y + 50 &&
                    bullet.y + 5 > enemy.y) {
                    bullets.splice(bIndex, 1);
                    enemies.splice(eIndex, 1);
                    score++;
                }
            });
        });
    }

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawTank();
        drawBullets();
        drawEnemies();
        moveBullets();
        moveEnemies();
        spawnEnemies();
        checkCollisions();
        requestAnimationFrame(gameLoop);
    }

    document.addEventListener("keydown", event => {
        if (event.key === "ArrowUp") y -= speed;
        if (event.key === "ArrowDown") y += speed;
        if (event.key === "ArrowLeft") x -= speed;
        if (event.key === "ArrowRight") x += speed;
        if (event.key === " ") bullets.push({ x: x + 22.5, y: y });
    });

    gameLoop();
}