let gameStatus = 0;

function gameStart() {
    if (gameStatus == 0) {
        alert("welcome to the tank game! use the W,S,A,D keys to move and mouse to shoot. good luck!");
        gameStatus = "running";
        console.log("Game started! gameStatus : ", gameStatus);
        
        document.getElementById("introTitle").style.display = "none";
        document.getElementById("gameInfoBg").style.display = "none";
        document.getElementById("gameStartButton").style.display = "none";
        document.body.style.backgroundBlendMode = "color";
        document.body.style.backgroundColor = "white";

        const tank = document.createElement("div");

        tank.style.width = "50px";
        tank.style.height = "50px";
        tank.style.background = "green";
        tank.style.position = "absolute";
        tank.style.left = "100px";
        tank.style.top = "100px";

        document.body.appendChild(tank);
        
    }
}