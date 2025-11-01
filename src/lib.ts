import { BSON } from "bson";

const REQUEST_ID = 2;
const OP_MSG = 2013;

export function buildOpMsg(doc: Record<string, any>): Buffer {
  const bsonBytes = BSON.serialize(doc);
  const flags = Buffer.alloc(4);
  const sectionKind = Buffer.from([0x00]);
  const body = Buffer.concat([flags, sectionKind, bsonBytes]);
  const msgLen = 16 + body.length;

  const header = Buffer.alloc(16);
  header.writeInt32LE(msgLen, 0);
  header.writeInt32LE(REQUEST_ID, 4);
  header.writeInt32LE(0, 8);
  header.writeInt32LE(OP_MSG, 12);

  return Buffer.concat([header, body]);
}