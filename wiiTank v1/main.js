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
        document.body.style.backgroundColor = "white";
        

        //TANK body
        const tank = document.createElement("div");
        tank.id = "playertank";
        tank.style.width = "60px";
        tank.style.height = "60px";
        tank.style.background = "green";
        tank.style.position = "absolute";
        tank.style.left = "300px";
        tank.style.top = "300px";
        document.body.appendChild(tank);

        // BARREL
        const barrel = document.createElement("div");

        barrel.style.width = "40px";
        barrel.style.height = "10px";
        barrel.style.background = "black";
        barrel.style.position = "absolute";

        barrel.style.left = "30px";
        barrel.style.top = "25px";

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