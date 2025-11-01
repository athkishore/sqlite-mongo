import net from 'node:net';
import { buildOpMsg } from './lib.js';
import fs from 'fs';
// const HOST = '127.0.0.1';
// const PORT = 27017;


const command = {
  insert: 'users',
  documents: [{ username: 'user1', name: 'User 1' }],
  $db: 'wizets',
};

const msg = buildOpMsg(command);

// const socket = net.createConnection({ host: HOST, port: PORT }, () => {
//   console.log('Connected');
//   console.log('sending msg:', msg);
//   socket.write(msg);
// });

// let buffer = Buffer.alloc(0);
// socket.on('data', (chunk) => {
//   buffer = Buffer.concat([buffer, chunk]);
//   if (buffer.length > 4) {
//     const msgLen = buffer.readInt32LE(0);
//     if (buffer.length >= msgLen) {
//       const payload = buffer.subarray(16, msgLen);
//       const flags = payload.readInt32LE(0);
//       const kind = payload.readUInt8(4);
//       const bsonReply = payload.subarray(5);
//       console.log('reply length:', msgLen);
//       console.log('flags:', flags, 'kind:', kind);
//       try {
//         const doc = BSON.deserialize(bsonReply);
//         console.log('reply BSON:', doc);
//       } catch {
//         console.log('raw:', bsonReply.toString('hex'))
//       }
//       socket.destroy();
//     }
//   }
// });

fs.writeFileSync('data/request.hex', msg);