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
    verifyWhatReceivedAndSentProperResponse(client, parsedData); // 5
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
  assignXOrO(currentClient); // 2
};

const assignXOrO = (currentClient) => {
  const playerChar = getPlayerChar(); // 3 X
  currentClient.char = playerChar; // X
  sendToSender(currentClient, {
    messageType: messageTypes.ServerSaysAssignPlayerChar, // zero
    data: {
      char: playerChar, // X
    },
  }); // 4
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
    receivedLastMovedOfOpponent(currentClient, data.data); // 6 data.data = {positionX: 2, positionY: 2, whatClicked: 'X'}
    return;
  }
};

const receivedLastMovedOfOpponent = (currentClient, messageData) => {
  console.log(messageData);
  const x = messageData.positionX; // 2
  const y = messageData.positionY; // 2
  const whatClicked = messageData.whatClicked; // undefined messageData.clickedChar X messageData.whatClicked

  if (!validateMove(whatClicked, currentClient.char)) {
    // 7
    return;
  }

  updateBoardState(x, y, whatClicked); // 8
  if (verifyEndGame()) {
    endGame(currentClient);
    return;
  }
  sendToOpponent(currentClient, {
    messageType: messageTypes.ServerSaysUpdatedBoard, // 4
    data: boardState, // aktualna tablica
  }); // 9
  previouslyClickecChar = whatClicked; // X
};

const validateMove = (whatClicked, currentClientChar) => {
  console.log(whatClicked); // undefined
  console.log(currentClientChar); // X
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
  receivedMoveXPosition, // 2
  receivedMoveYPosition, // 2
  receivedMoveChar // X
) => {
  boardState[receivedMoveXPosition][receivedMoveYPosition] = receivedMoveChar;
};

const verifyEndGame = () => {
  return false;
};

const endGame = (currentClient, opponentX, opponentY) => {
  clearBoardsState();
  previouslyClickecChar = undefined;
  sendToSender(currentClient, {
    messageType: messageTypes.ServerSaysWin,
  });
  sendToOpponent(currentClient, {
    messageType: messageTypes.ServerSaysGameOver,
    data: { positionX: opponentX, positionY: opponentY },
  });
  wss.clients.forEach((client) => {
    client.terminate();
  });
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
    targetClient.send(JSON.stringify(data)); // przesyłanie do drugiego klienta aktualny obiekt
  }
};
