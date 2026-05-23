let gameStatus = 0;

function gameStart() {
    if (gameStatus == 0) {
        alert("welcome to the tank game! use the W,S,A,D keys to move and mouse to shoot. good luck!");
        gameStatus = "running";
        console.log("Game started! gameStatus : ", gameStatus);
        
        document.getElementById("introTitle").style.display = "none";
        document.getElementById("gameInfoBg").style.display = "none";
        document.getElementById("gameStartButton").style.display = "none";
        
        const canvas = document.getElementById("gameStage");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.display = "block";
        canvas.style.position = "absolute";
        canvas.style.left = "0";
        canvas.style.top = "0";
        canvas.style.zIndex = "0";
        canvas.style.border = "1px solid black";
        canvas.style.color = "black";
        
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

            const tankX = tank.offsetLeft + 30;
            const tankY = tank.offsetTop + 30;

            const dx = e.clientX - tankX;
            const dy = e.clientY - tankY;

            const angle = Math.atan2(dy, dx) * 180 / Math.PI;

            barrel.style.transform = `rotate(${angle}deg)`;
        });

    }
}

function createWalls() {

    // TOP WALL
    const topWall = document.createElement("div");
    topWall.style.position = "absolute";
    topWall.style.top = "0";
    topWall.style.left = "0";
    topWall.style.width = "100%";
    topWall.style.height = "20px";
    topWall.style.background = "black";
    document.body.appendChild(topWall);


    // BOTTOM WALL
    const bottomWall = document.createElement("div");
    bottomWall.style.position = "absolute";
    bottomWall.style.bottom = "0";
    bottomWall.style.left = "0";
    bottomWall.style.width = "100%";
    bottomWall.style.height = "20px";
    bottomWall.style.background = "black";
    document.body.appendChild(bottomWall);


    // LEFT WALL
    const leftWall = document.createElement("div");
    leftWall.style.position = "absolute";
    leftWall.style.top = "0";
    leftWall.style.left = "0";
    leftWall.style.width = "20px";
    leftWall.style.height = "100%";
    leftWall.style.background = "black";
    document.body.appendChild(leftWall);


    // RIGHT WALL
    const rightWall = document.createElement("div");
    rightWall.style.position = "absolute";
    rightWall.style.top = "0";
    rightWall.style.right = "0";
    rightWall.style.width = "20px";
    rightWall.style.height = "100%";
    rightWall.style.background = "black";
    document.body.appendChild(rightWall);
}

function tankMovement(event) {

    const tank = document.getElementById('playertank');
    const style = window.getComputedStyle(tank);

    let left = parseInt(style.getPropertyValue('left'));
    let top = parseInt(style.getPropertyValue('top'));

    const tankSize = 60;
    const speed = 20;

    let key = event.key;

    if(key == "w" && top > 0){
        tank.style.top = (top - speed) + 'px';
    }

    if(key == "s" && top < window.innerHeight - tankSize){
        tank.style.top = (top + speed) + 'px';
    }

    if(key == "a" && left > 0){
        tank.style.left = (left - speed) + 'px';
    }

    if(key == "d" && left < window.innerWidth - tankSize){
        tank.style.left = (left + speed) + 'px';
    }
}