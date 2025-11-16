import { BSON } from "bson";

export type MessageHeader = {
  messageLength: number;
  requestID: number;
  responseTo: number;
  opCode: number;
}

export type WireMessage = {
  header: MessageHeader;
  payload: 
    | OpQueryPayload
    | OpReplyPayload
    | OpMsgPayload;
};

type OpQueryPayload = {
  _type: 'OP_QUERY';
  flags: number;
  fullCollectionName: string;
  numberToSkip: number;
  numberToReturn: number;
  query: BSON.Document;
  returnFieldsSelector?: BSON.Document | undefined;
};

type OpReplyPayload = {
  _type: 'OP_REPLY';
  responseFlags: number;
  cursorID: BigInt;
  startingFrom: number;
  numberReturned: number;
  documents: BSON.Document[];
};

type OpMsgPayload = {
  _type: 'OP_MSG';
  flagBits: number;
  sections: OpMsgPayloadSection[];
  checksum?: number;
};

type OpMsgPayloadSection = {
  sectionKind: 0;
  document: BSON.Document;
} | {
  sectionKind: 1;
  size: number;
  documentSequenceIdentifier: string;
  documents: BSON.Document[];
};

export function decodeMessage(buf: Buffer): WireMessage {
  const messageLength = buf.readInt32LE(0);
  const requestID = buf.readInt32LE(4);
  const responseTo = buf.readInt32LE(8);
  const opCode = buf.readInt32LE(12);

  let payload: WireMessage['payload'];

  switch(opCode) {
    case 2004: 
      payload = decodeOpQueryPayload(buf.subarray(16));
      break;
    case 1:
      payload = decodeOpReplyPayload(buf.subarray(16));
      break;
    case 2013:
      payload = decodeOpMsgPayload(buf.subarray(16));
      break;
    default:
      throw new Error('Unknown opcode');
  }

  return {
    header: { messageLength, requestID, responseTo, opCode },
    payload
  };
}

function decodeOpQueryPayload(buf: Buffer): OpQueryPayload {
  let pointer = 0;

  const flags = buf.readInt32LE(pointer);
  pointer += 4;

  const { s: fullCollectionName, len } = readNullTerminatedString(buf, pointer);
  pointer += len;

  const numberToSkip = buf.readInt32LE(pointer);
  pointer += 4;

  const numberToReturn = buf.readInt32LE(pointer);
  pointer += 4;

  const { documents: [query, returnFieldsSelector] } = readBSONDocuments(buf, pointer);

  if (!query) throw new Error('Missing query')

  return {
    _type: 'OP_QUERY',
    flags,
    fullCollectionName,
    numberToSkip,
    numberToReturn,
    query,
    returnFieldsSelector,
  };
}

function decodeOpReplyPayload(buf: Buffer): OpReplyPayload {
  let pointer = 0;
  const responseFlags = buf.readInt32LE(pointer);
  pointer += 4;

  const cursorID = buf.readBigInt64LE(pointer);
  pointer += 8;

  const startingFrom = buf.readInt32LE(pointer);
  pointer += 4;

  const numberReturned = buf.readInt32LE(pointer);
  pointer += 4;

  const { documents } = readBSONDocuments(buf, pointer);

  return {
    _type: 'OP_REPLY',
    responseFlags,
    cursorID,
    startingFrom,
    numberReturned,
    documents,
  };
}

function decodeOpMsgPayload(buf: Buffer): OpMsgPayload {
  let pointer = 0;
  const flagBits = buf.readInt32LE(pointer);
  pointer += 4;

  const sections = decodeOpMsgPayloadSections(buf, pointer);

  // Skip the optional checksum

  return {
    _type: 'OP_MSG',
    flagBits,
    sections,
  }
}

function decodeOpMsgPayloadSections(buf: Buffer, offset: number): OpMsgPayloadSection[] {
  const sections: OpMsgPayloadSection[] = [];
  let pointer = offset;

  while (pointer < buf.length) {
    const sectionKind = buf.readUint8(pointer);
    pointer += 1;

    switch(sectionKind) {
      case 0: {
        const size = buf.readInt32LE(pointer);
        const { documents, len } = readBSONDocuments(buf.subarray(pointer, pointer + size), 0);
        // TODO: Assert that exactly one document exists

        const section = {
          sectionKind,
          document: documents[0]!,
        };

        sections.push(section);
        pointer += size;
        break;
      }

      case 1: {
        const size = buf.readInt32LE(pointer);
        pointer += 4;

        const { s: documentSequenceIdentifier, len } = readNullTerminatedString(buf, offset + pointer);
        pointer += len;

        const { documents } = readBSONDocuments(buf, pointer);

        // TODO: Assert that there are no more bytes to be decoded

        const section = {
          sectionKind,
          size,
          documentSequenceIdentifier,
          documents,
        };

        sections.push(section);
        break;
      }
    }
  }

  return sections;
}

function readNullTerminatedString(buf: Buffer, offset: number): {
  s: string;
  len: number; // including the null termination byte
} {
  const nullIndex = buf.indexOf(0, offset);
  const s = buf.toString('utf-8', offset, nullIndex);
  
  return {
    s,
    len: (nullIndex - offset) + 1
  };
}

function readBSONDocuments(buf: Buffer, offset: number): {
  documents: BSON.Document[];
  len: number; // bytes read
} {
  let documents: BSON.Document[] = [];
  let pointer = offset;

  while (pointer < buf.length) {
    if (buf.length - pointer < 4) break;
    const size = buf.readInt32LE(pointer);
    if (buf.length - pointer < size) break;
    const docBuf = buf.subarray(pointer, pointer + size);
    try {
      const doc = BSON.deserialize(docBuf);
      documents.push(doc);
    } catch {
      throw new Error('Invalid BSON at offset ' + pointer);
    }
    pointer += size;
  }

  return {
    documents,
    len: pointer - offset,
  }
}