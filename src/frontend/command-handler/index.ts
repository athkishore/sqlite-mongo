import { executeQueryIR } from "#backend/index.js";
import { generateQueryIRFromCommand } from "#frontend/query-parser/index.js";
import type { OpMsgPayload, OpMsgPayloadSection, WireMessage } from "#frontend/server/lib/wire.js";
import type { CommandResponse, MQLCommand } from "#frontend/types.js";
import { ObjectId } from "bson";

export async function getResponse(message: WireMessage): Promise<WireMessage> {
  const { header, payload } = message;
  const { opCode, requestID } = header;

  const responseHeader = {
    messageLength: 0, // will be set by encoder
    requestID: 1, // TODO: Unhardcode - maintain state for each connection, maybe in the server
    responseTo: requestID,
    opCode: opCode === 2004 ? 1 : 2013, // Handle only OP_QUERY and OP_MSG
  };

  if (opCode === 2004) {
    // hardcoded response
    return {
      header: responseHeader,
      payload: {
        _type: 'OP_REPLY',
        responseFlags: 8,
        cursorID: 0n,
        startingFrom: 0,
        numberReturned: 1,
        documents: [
          {
            helloOk: true,
            ismaster: true,
            topologyVersion: {
              processId: new ObjectId(),
              counter: 0,
            },
            maxBsonObjectSize: 16777216,
            maxMessageSizeBytes: 48000000,
            maxWriteBatchSize: 100000,
            localTime: new Date().toISOString(),
            logicalSessionTimeoutMinutes: 30,
            connectionId: 1,
            minWireVersiion: 0,
            maxWireVersion: 21,
            readOnly: false,
            ok: 1,
          },
        ],
      },
    }
  } else if (opCode === 2013) {
    // executeCommand()
  }

  throw new Error('Unknown opcode: ' + opCode);
}

export async function handleOpMsg(payload: OpMsgPayload): Promise<OpMsgPayload | undefined> {
  const { sections } = payload;
  const command = getCommandFromOpMsgBody(sections[0] as Extract<OpMsgPayload, { sectionKind: 0 }>)
  
  if (!command) {
    return {
      _type: 'OP_MSG',
      flagBits: 0,
      sections: [
        {
          sectionKind: 0,
          document: {
            ok: 0,
            errmsg: `No such command: '${Object.keys((sections[0] as Extract<OpMsgPayloadSection, { sectionKind: 0 }>).document)[0]}'`,
            code: 59,
            codeName: 'CommandNotFound',
          },
        },
      ],
    }
  }


  const queryIR = generateQueryIRFromCommand(command);
  const resultIR = executeQueryIR(queryIR);
  

  return undefined;
}

function getCommandFromOpMsgBody(
  body: Extract<OpMsgPayloadSection, { sectionKind: 0 }>
): MQLCommand | undefined {
  const commandType = MONGODB_COMMANDS.find(cmd => cmd === Object.keys(body)[0]);
  
  if (!commandType) return undefined;

  switch (commandType) {
    case 'buildInfo': {
      return {
        command: 'buildInfo',
        database: body.document.$db,
      };
    }

    case 'getParameter': {
      return {
        command: 'getParameter',
        database: body.document.$db,
        featureCompatibilityVersion: body.document.featureCompatibilityVersion,
      };
    }

    case 'aggregate': {
      return {
        command: 'aggregate',
        database: body.document.$db,
        pipeline: body.document.pipeline,
        cursor: body.document.cursor,
      };
    }

    case 'ping': {
      
    }

  }
}

const MONGODB_COMMANDS = [
  'buildInfo',
  'getParameter',
  'aggregate',
  'ping',
  // 'getLog',
  'hello',
  // 'endSessions',
] as const;