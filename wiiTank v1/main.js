const gameStatus = 0;
function gameStart() {
    if (gameStatus == 0) {
        alert("welcome to the tank game! use the arrow keys to move and space to shoot. good luck!");
        gameStatus = 1;
        console.log("Game started! gameStatus : ", gameStatus);
        
        
    }
}