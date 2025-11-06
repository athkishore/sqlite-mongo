import { createConnection, createServer, Socket } from 'node:net';

// We will start the mongod server on port 9000, 
// not the traditional port 27017. 
// Instead we will bind our eavesdropping proxy 
// to 27017 and forward messages to 9000.
const MONGOD_HOST = '127.0.0.1';
const MONGOD_PORT = 9000;

const LISTEN_HOST = '127.0.0.1';
const LISTEN_PORT = 27017;

async function handleNewConnection(clientSock: Socket) {
  console.log('client connected on port:', clientSock.remotePort);

  // open a corresponding connection 
  // to mongod server on port 9000
  const serverSock = createConnection(
    { host: MONGOD_HOST, port: MONGOD_PORT },
    () => console.log('created proxy connection to mongod server')
  );

  let c2sBuf = Buffer.alloc(0);
  let s2cBuf = Buffer.alloc(0);

  // register a callback to forward to server
  // any data sent from client
  clientSock.on('data', (data) => {
    serverSock.write(data);
    c2sBuf = Buffer.concat([c2sBuf, data]);
    const messages = processBuffer(c2sBuf); // to be defined
    messages.forEach(message => {
      console.log(`C -> S message`, message);
    });
  });

  // register a callback to forward to client
  // any data sent from server
  serverSock.on('data', (data) => {
    clientSock.write(data);
    s2cBuf = Buffer.concat([s2cBuf, data]);
    const messages = processBuffer(s2cBuf);
    messages.forEach(message => {
      console.log('S -> C message', message);
    })
  });
}

const server = createServer(handleNewConnection);

server.listen(LISTEN_PORT, LISTEN_PORT, () => {
  console.log(
    'Mongo TCP proxy listening on',
    `${LISTEN_HOST}:${LISTEN_PORT}`,
    '->',
    `${MONGOD_HOST}:${MONGOD_PORT}`,
  );
})

function processBuffer(buf: Buffer) {
  let offset = 0;
  let messages: WireMessage[] = [];

  // If the buffer has less than 4 bytes to read, we
  // haven't received the messageLength field yet
  while(buf.length - offset >= 4) {
    const messageLength = buf.readInt32LE(offset);

    // If the buffer has less than messageLenth bytes to read,
    // wait till more bytes arrive
    if (buf.length - offset < messageLength) break;

    const messageBuf = buf.subarray(offset, offset + messageLength);
    const message = handleMessage(messageBuf);
    messages.push(message);

    offset += messageLength;

    // Remove the processed bytes from the buffer
    buf = buf.subarray(offset);
  }
  return messages;
}

type WireMessage = {
  header: {
    messageLength: number;
    requestID: number;
    responseTo: number;
    opCode: number;
  };
  // todo: payload types
};

function handleMessage(buf: Buffer): WireMessage {
  // decode header
  const messageLength = buf.readInt32LE(0);
  const requestID = buf.readInt32LE(4);
  const responseTo = buf.readInt32LE(8);
  const opCode = buf.readInt32LE(12);

  
  return {
    header: { messageLength, requestID, responseTo, opCode },
  };
}