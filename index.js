const btnPlay = document.querySelector(".btnPlay");
const table = document.querySelector("table");
const tdElements = [...document.querySelectorAll("td")];
const elementEndGame = document.querySelector(".endGame");
const elementWinnerOrLoser = document.querySelector(".winnerOrLoser");

let char = undefined;
let lastPlacedChar = undefined;
let ws = undefined;

let gameOver = false; // tu

let boardState = [
  [undefined, undefined, undefined],
  [undefined, undefined, undefined],
  [undefined, undefined, undefined],
];

const messageTypes = {
  ServerSaysAssignPlayerChar: 0,
  ClientSaysLastMove: 1,
  ServerSaysGameOver: 2,
  ClientSaysGameCancelled: 3,
  ServerSaysUpdatedBoard: 4,
  ServerSaysWin: 5,
};

btnPlay.addEventListener("click", () => {
  ws = new WebSocket("ws://localhost:8080");

  btnPlay.style.display = "none";
  table.style.display = "block";

  ws.addEventListener("message", (data) => {
    const parsedData = JSON.parse(data.data);

    if (parsedData.messageType == messageTypes.ServerSaysAssignPlayerChar) {
      char = parsedData.data.char;
    } else if (parsedData.messageType == messageTypes.ServerSaysUpdatedBoard) {
      lastPlacedChar = parsedData.data.whatClicked;
      let x = parsedData.data.x;
      let y = parsedData.data.y;
      boardState[x][y] = lastPlacedChar;
      tdElements.forEach((td) => {
        if (td.getAttribute("data-x") == y && td.getAttribute("data-y") == x) {
          td.innerText = lastPlacedChar;
        }
      });
      console.log(boardState);
    } else if (parsedData.messageType == messageTypes.ServerSaysWin) {
      elementWinnerOrLoser.innerText = ` Zwycięzca: `;
      elementWinnerOrLoser.style.color = "green";
      elementEndGame.innerHTML += char;
      elementEndGame.style.display = "block";
    } else if (parsedData.messageType == messageTypes.ServerSaysGameOver) {
      gameOver = true; // tu
      elementWinnerOrLoser.innerText = ` Przegrany: `;
      elementWinnerOrLoser.style.color = "red";
      elementEndGame.innerHTML += char;
      elementEndGame.style.display = "block";
    }
  });
});

tdElements.forEach((td) => {
  td.addEventListener("click", (ev) => {
    let positionX = Number(ev.target.getAttribute("data-y"));
    let positionY = Number(ev.target.getAttribute("data-x"));

    let position = {
      messageType: messageTypes.ClientSaysLastMove,
      data: {
        positionX,
        positionY,
        whatClicked: char,
      },
    };

    if (
      ev.target.innerText == "X" ||
      ev.target.innerText == "O" ||
      char == lastPlacedChar ||
      gameOver // tu
    ) {
      return;
    }

    lastPlacedChar = char;
    boardState[positionX][positionY] = lastPlacedChar;
    ev.target.innerText = char;

    ws.send(JSON.stringify(position));
  });
});
