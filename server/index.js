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
    endGame(currentClient);
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
    targetClient.send(JSON.stringify(data));
  }
};
