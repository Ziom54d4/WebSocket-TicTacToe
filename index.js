const btnPlay = document.querySelector(".btnPlay");
const table = document.querySelector("table");
const tdElements = [...document.querySelectorAll("td")];

let char = undefined;
let enemyChar = undefined;
let ws = undefined;

btnPlay.addEventListener("click", () => {
  ws = new WebSocket("ws://localhost:8080");

  btnPlay.style.display = "none";
  table.style.display = "block";

  ws.addEventListener("message", (data) => {
    console.log(data);
    console.log("Weszło do message!");
    const parsedData = JSON.parse(data.data);

    char = parsedData.data.char;

    /*
    boardState = parsedData.data;
    
    for (let i = 0; i < boardState.length; i++) {
      for (let j = 0; j < boardState[0].length; j++) {
        if (boardState[i][j] != null) {
          console.log("ok");
          tdElements.forEach((td) => {
            if (
              td.getAttribute("data-x") == i &&
              td.getAttribute("data-y") == j
            ) {
              let positionX = td.getAttribute("data-x");
              let positionY = td.getAttribute("data-y");
              let position = {
                messageType: messageTypes.ClientSaysLastMove,
                data: {
                  positionX,
                  positionY,
                  whatClicked: "X",
                },
              };
              ws.send(JSON.stringify(position));
              td.innerText = char;
            }
          });
        }
      }
    }
    */

    const updatedBoard = parsedData.data;

    for (let i = 0; i < updatedBoard.length; i++) {
      for (let j = 0; j < updatedBoard[0].length; j++) {
        if (updatedBoard[i][j] != null) {
          enemyChar = updatedBoard[i][j];
          console.log(char);
          tdElements.forEach((td) => {
            if (
              td.getAttribute("data-x") == i &&
              td.getAttribute("data-y") == j
            ) {
              td.innerText = enemyChar;
            }
          });
        }
      }
    }

    console.log(parsedData);
    console.log(parsedData.data);
    console.log(char); // char robi się undefined u drugiej osoby po pierwszym kliknięciu pierwszej osoby w którąkolwiek komórkę planszy. Wynika to z tego że obiekt data podany jako parametr zmienia się na inny obiekt za każdym razem
  });
});

tdElements.forEach((td) =>
  td.addEventListener("click", (ev) => {
    console.log(ev.target);
    let positionX = Number(ev.target.getAttribute("data-x")); // zakładamy że 2
    let positionY = Number(ev.target.getAttribute("data-y")); // zakładamy że 2

    console.log(char); // X

    let position = {
      messageType: messageTypes.ClientSaysLastMove, // 1
      data: {
        positionX, // zakładamy że 2
        positionY, // zakładamy że 2
        whatClicked: char, // X
      },
    };

    console.log(positionX);
    console.log(positionY);
    ev.target.innerText = char; // stawiamy X w pole które klikneliśmy
    console.log(boardState);
    ws.send(JSON.stringify(position)); // tutaj leci do serwera po pierwszym kliknięciu
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
