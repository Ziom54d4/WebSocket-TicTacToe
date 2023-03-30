const btnPlay = document.querySelector(".btnPlay");
const table = document.querySelector("table");
const tdElements = [...document.querySelectorAll("td")];

let char = undefined;
let charFromTheBoard = undefined;
let ws = undefined;

btnPlay.addEventListener("click", () => {
  ws = new WebSocket("ws://localhost:8080");

  btnPlay.style.display = "none";
  table.style.display = "block";

  ws.addEventListener("message", (data) => {
    const parsedData = JSON.parse(data.data);

    if (parsedData.messageType == messageTypes.ServerSaysAssignPlayerChar) {
      char = parsedData.data.char;
    } else if (parsedData.messageType == messageTypes.ServerSaysUpdatedBoard) {
      boardState = parsedData.data;
      console.log(boardState);
      for (let i = 0; i < boardState.length; i++) {
        for (let j = 0; j < boardState[0].length; j++) {
          if (boardState[i][j] != undefined) {
            charFromTheBoard = boardState[i][j];
            tdElements.forEach((td) => {
              if (
                td.getAttribute("data-x") == j &&
                td.getAttribute("data-y") == i
              ) {
                td.innerText = charFromTheBoard; // przechodzi po całej tablicy przeciwnika i podstawia zebrane znaki
              }
            });
          }
        }
      }
    }
  });
});

tdElements.forEach((td) =>
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

    ev.target.innerText = char;

    ws.send(JSON.stringify(position));
  })
);

const messageTypes = {
  ServerSaysAssignPlayerChar: 0,
  ClientSaysLastMove: 1,
  ServerSaysGameOver: 2,
  ClientSaysGameCancelled: 3,
  ServerSaysUpdatedBoard: 4,
  ServerSaysWin: 5,
};

var boardState = [
  [undefined, undefined, undefined],
  [undefined, undefined, undefined],
  [undefined, undefined, undefined],
];
