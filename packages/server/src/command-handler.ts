import { executeQueryIR } from "@chikkadb/backend-sqlite";
import { generateQueryIRFromCommand } from '@chikkadb/command-parser';
import type { OpMsgPayload, OpMsgPayloadSection, WireMessage } from "@chikkadb/interfaces/wire/types";
import type { CommandResponse, MQLCommand } from "@chikkadb/interfaces/command/types";
import { ObjectId } from "bson";
import os from 'os';
import debug from "debug";
import { startupOptions } from "./config.js";
import { getHardcodedResponse } from "./hard-coded-responses.js";

const processId = new ObjectId();

const logCommandResult = debug('command:result');
const logCommandMQL = debug('command:mql');
const logCommandIR = debug('command:ir');

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
              processId,
              counter: 0n,
            },
            maxBsonObjectSize: 16777216,
            maxMessageSizeBytes: 48000000,
            maxWriteBatchSize: 100000,
            localTime: new Date(),
            logicalSessionTimeoutMinutes: 30,
            connectionId: 1,
            minWireVersion: 0,
            maxWireVersion: 21,
            readOnly: false,
            ok: 1,
          },
        ],
      },
    }
  } else if (opCode === 2013) {
    const responsePayload = await handleOpMsg(payload as OpMsgPayload);
    logCommandResult(responsePayload);
    if (responsePayload) {
      return {
        header: responseHeader,
        payload: responsePayload,
      }
    }

    throw new Error('Unable to get response for requestId: ' + requestID);
  }

  throw new Error('Unknown opcode: ' + opCode);
}

export async function handleOpMsg(payload: OpMsgPayload): Promise<OpMsgPayload | undefined> {
  const { sections } = payload;
  const command = getCommandFromOpMsgBody(
    sections[0] as Extract<OpMsgPayloadSection, { sectionKind: 0 }>,
    sections.slice(0) as Extract<OpMsgPayloadSection, { sectionKind: 1 }>[]
  );
  
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
    };
  }

  switch (command.command) {
    case 'buildInfo':
    case 'getParameter':
    case 'ping':
    case 'getLog':
    case 'hello':
    case 'ismaster':
    case 'listIndexes':
    case 'connectionStatus':
    case 'hostInfo':
      return getHardcodedResponse(command);
  }


  const queryIR = generateQueryIRFromCommand(command);
  const resultIR = executeQueryIR(queryIR, startupOptions.dbpath);

  delete resultIR['_type'];

  // TODO: Define strict types for responses of specific commands

  logCommandResult(resultIR);
  

  return {
    _type: 'OP_MSG',
    flagBits: 0,
    sections: [
      {
        sectionKind: 0,
        document: resultIR,
      }
    ]
  };
}

function getCommandFromOpMsgBody(
  body: Extract<OpMsgPayloadSection, { sectionKind: 0 }>,
  additionalSections: Extract<OpMsgPayloadSection, { sectionKind: 1 }>[]
): MQLCommand | undefined {
  const commandType = MONGODB_COMMANDS.find(cmd => cmd === Object.keys(body.document)[0]);
  
  if (!commandType) return undefined;

  const { document } = body;

  for (const s of additionalSections) {
    document[s.documentSequenceIdentifier] = (document[s.documentSequenceIdentifier] ?? []).concat(s.documents);
  }
  switch (commandType) {
    case 'buildInfo': {
      return {
        command: 'buildInfo',
        database: document.$db,
      };
    }

    case 'getParameter': {
      return {
        command: 'getParameter',
        database: document.$db,
        featureCompatibilityVersion: document.featureCompatibilityVersion,
      };
    }

    case 'aggregate': {
      // TODO: parsing of raw aggregate command needs to be streamlined
      return {
        command: 'aggregate',
        database: document.$db,
        collection: document.aggregate,
        pipeline: document.pipeline.map((s: Record<string, any>) => {
          const stage = Object.keys(s)[0];
          
          switch(stage) {
            case '$match': {
              return {
                stage,
                filter: s[stage],
              };
            }
            case '$count': {
              return {
                stage,
                key: s[stage],
              };
            }
            case '$limit': {
              return {
                stage,
                limit: s[stage],
              };
            }
            default: {
              return null;
            }
          }
        }),
        cursor: document.cursor,
      };
    }

    case 'ping': {
      return {
        command: 'ping',
        database: document.$db,
      };
    }

    case 'getLog': {
      return {
        command: 'getLog',
        database: document.$db,
        value: document.getLog,
      };
    }

    case 'hello': {
      return {
        command: 'hello',
        database: document.$db,
      }
    }

    case 'ismaster': {
      return {
        command: 'ismaster',
        database: document.$db,
      }
    }

    case 'listIndexes': {
      return {
        command: 'listIndexes',
        database: document.$db,
        collection: document.listIndexes,
      };
    }

    case 'endSessions': {
      return {
        command: 'endSessions',
        database: document.$db,
      };
    }

    case 'create': {
      return {
        command: 'create',
        database: document.$db,
        collection: document.create,
      };
    }

    case 'drop': {
      return {
        command: 'drop',
        database: document.$db,
        collection: document.drop,
      };
    }

    case 'dropDatabase': {
      return {
        command: 'dropDatabase',
        database: document.$db,
      };
    }

    case 'insert': {
      return {
        command: 'insert',
        database: document.$db,
        collection: document.insert,
        documents: document.documents,
      };
    }

    case 'find': {
      return {
        command: 'find',
        database: document.$db,
        collection: document.find,
        filter: document.filter,
        projection: document.projection,
        sort: document.sort,
        limit: document.limit,
        skip: document.skip,
      };
    }

    case 'count': {
      return {
        command: 'count',
        database: document.$db,
        collection: document.count,
        query: document.query ?? {},
      };
    }

    case 'delete': {
      return {
        command: 'delete',
        database: document.$db,
        collection: document.delete,
        deletes: document.deletes,
      };
    }

    case 'update': {
      return {
        command: 'update',
        database: document.$db,
        collection: document.update,
        updates: document.updates,
      };
    }
    
    case 'findAndModify': {
      return {
        command: 'findAndModify',
        database: document.$db,
        collection: document.findAndModify,
        query: document.query,
        update: document.update,
      };
    }

    case 'connectionStatus': {
      return {
        command: 'connectionStatus',
        database: document.$db,
        showPrivileges: document.showPrivileges,
      }
    }

    case 'hostInfo': {
      return {
        command: 'hostInfo',
        database: document.$db,
      };
    }

    case 'listDatabases': {
      return {
        command: 'listDatabases',
        database: document.$db,
        nameOnly: document.nameOnly,
      };
    }

    case 'listCollections': {
      return {
        command: 'listCollections',
        database: document.$db,
        nameOnly: document.nameOnly,
      };
    }
  }
}

const MONGODB_COMMANDS = [
  'buildInfo',
  'getParameter',
  'aggregate',
  'ping',
  'getLog',
  'hello',
  'ismaster',
  'endSessions',
  'create',
  'insert',
  'find',
  'count',
  'delete',
  'update',
  'findAndModify',
  'aggregate',
  'connectionStatus',
  'hostInfo',
  'listDatabases',
  'listCollections',
  'listIndexes',
  'drop',
  'dropDatabase',
] as const;