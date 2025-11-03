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

  // register a callback to forward to server
  // any data sent from client
  clientSock.on('data', (data) => {
    serverSock.write(data);
  });

  // register a callback to forward to client
  // any data sent from server
  serverSock.on('data', (data) => {
    clientSock.write(data);
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
