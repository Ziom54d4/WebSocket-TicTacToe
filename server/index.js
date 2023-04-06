import { WebSocketServer } from "ws";
const wss = new WebSocketServer({ port: 8080 });

var previouslyClickecChar = undefined;

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
/*
{
  messageType: messageTypes,
  data: {positionX: Number, positionY: Number, whatClicked: string} | [][]
}
*/

wss.on("connection", (client) => {
  console.log("connection established");
  console.log("clients size " + wss.clients.size);
  joinOrReject(client); // 1

  client.on("message", (data) => {
    const parsedData = JSON.parse(data);
    console.log(parsedData);
    verifyWhatReceivedAndSentProperResponse(client, parsedData);
  });

  client.on("close", () => {
    console.log("clients size " + wss.clients.size);
    console.log("connection closed " + client.char);
    sendToOpponent(client, {
      messageType: messageTypes.ClientSaysGameCancelled,
    });
  });
});

const joinOrReject = (currentClient) => {
  if (wss.clients.size === 3) {
    currentClient.terminate();
    return;
  }
  assignXOrO(currentClient);
};

const assignXOrO = (currentClient) => {
  const playerChar = getPlayerChar();
  currentClient.char = playerChar;
  sendToSender(currentClient, {
    messageType: messageTypes.ServerSaysAssignPlayerChar,
    data: {
      char: playerChar,
    },
  });
};

const getPlayerChar = () => {
  if (availableChars.length === 0) {
    availableChars = [...chars];
  }

  const charToReturn = availableChars[0];
  availableChars.splice(0, 1);
  return charToReturn;
};

const sendToSender = (currentClient, data) => {
  currentClient.send(JSON.stringify(data));
};

var availableChars = ["X", "O"];
const chars = ["X", "O"];

const verifyWhatReceivedAndSentProperResponse = (currentClient, data) => {
  if (data.messageType === messageTypes.ClientSaysLastMove) {
    receivedLastMovedOfOpponent(currentClient, data.data);
    return;
  }
};

const receivedLastMovedOfOpponent = (currentClient, messageData) => {
  console.log(messageData);
  const x = messageData.positionX;
  const y = messageData.positionY;
  const whatClicked = messageData.whatClicked;

  if (!validateMove(whatClicked, currentClient.char)) {
    return;
  }

  updateBoardState(x, y, whatClicked);
  if (verifyEndGame()) {
    endGame(currentClient, x, y, whatClicked); // whatClicked
    return;
  }

  sendToOpponent(currentClient, {
    messageType: messageTypes.ServerSaysUpdatedBoard,
    data: { whatClicked, x, y }, // boardState
  });
  previouslyClickecChar = whatClicked;
};

const validateMove = (whatClicked, currentClientChar) => {
  console.log(whatClicked);
  console.log(currentClientChar);
  if (
    previouslyClickecChar != undefined &&
    previouslyClickecChar === whatClicked
  ) {
    console.log("Client can make one move at a time");
    return false;
  }

  if (whatClicked !== currentClientChar) {
    console.log("Client's trying to cheat");
    return false;
  }

  return true;
};

const updateBoardState = (
  receivedMoveXPosition,
  receivedMoveYPosition,
  receivedMoveChar
) => {
  boardState[receivedMoveXPosition][receivedMoveYPosition] = receivedMoveChar;
  console.log(boardState);
};

const verifyEndGame = () => {
  if (
    (boardState[0][0] == "X" &&
      boardState[1][1] == "X" &&
      boardState[2][2] == "X") ||
    (boardState[0][0] == "O" &&
      boardState[1][1] == "O" &&
      boardState[2][2] == "O")
  ) {
    return true;
  } // skos od lewej do prawej

  if (
    (boardState[0][2] == "X" &&
      boardState[1][1] == "X" &&
      boardState[2][0] == "X") ||
    (boardState[0][2] == "O" &&
      boardState[1][1] == "O" &&
      boardState[2][0] == "O")
  ) {
    return true;
  } // skos od prawej do lewej

  for (let i = 0; i < boardState.length; i++) {
    if (
      (boardState[i][0] == "X" &&
        boardState[i][1] == "X" &&
        boardState[i][2] == "X") ||
      (boardState[i][0] == "O" &&
        boardState[i][1] == "O" &&
        boardState[i][2] == "O")
    ) {
      return true;
    } // dla wierszy

    if (
      (boardState[0][i] == "X" &&
        boardState[1][i] == "X" &&
        boardState[2][i] == "X") ||
      (boardState[0][i] == "O" &&
        boardState[1][i] == "O" &&
        boardState[2][i] == "O")
    ) {
      return true;
    } // dla kolumn
  }

  return false;
};

const endGame = (currentClient, opponentX, opponentY, whatClicked) => {
  // whatClicked
  clearBoardsState();
  previouslyClickecChar = undefined;
  let x = opponentX;
  let y = opponentY;
  sendToSender(currentClient, {
    messageType: messageTypes.ServerSaysWin,
  });
  // sendToOpponent (ten pierwszy na dole - pod spodem jest mój)
  sendToOpponent(currentClient, {
    messageType: messageTypes.ServerSaysUpdatedBoard,
    data: { whatClicked, x, y },
  });
  sendToOpponent(currentClient, {
    messageType: messageTypes.ServerSaysGameOver,
    data: { positionX: opponentX, positionY: opponentY },
  });

  /*
  wss.clients.forEach((client) => {
    client.terminate();
  });
  */ // nie mój kod
};

const clearBoardsState = () => {
  boardState = [
    [undefined, undefined, undefined],
    [undefined, undefined, undefined],
    [undefined, undefined, undefined],
  ];
};

const sendToOpponent = (currentClient, data) => {
  console.log(data);
  var targetClient = [...wss.clients].filter(
    (client) => client != currentClient
  )[0];

  if (targetClient != undefined) {
    console.log("send to opponent");
    targetClient.send(JSON.stringify(data));
  }
};
