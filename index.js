const btnPlay = document.querySelector(".btnPlay");
const table = document.querySelector("table");
const tdElements = [...document.querySelectorAll("td")];

let char = undefined;
let lastPlacedChar = undefined;
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
      lastPlacedChar = parsedData.data.whatClicked;
      let x = parsedData.data.x; // wiersze
      let y = parsedData.data.y; // kolumny
      boardState[x][y] = lastPlacedChar;
      tdElements.forEach((td) => {
        if (td.getAttribute("data-x") == y && td.getAttribute("data-y") == x) {
          td.innerText = lastPlacedChar;
        }
      });
      console.log(boardState);
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

    if (
      ev.target.innerText == "X" ||
      ev.target.innerText == "O" ||
      char == lastPlacedChar
    ) {
      return;
    }

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
