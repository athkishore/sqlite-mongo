import type { MQLCommand } from "@chikkadb/interfaces/command/types";
import type { OpMsgPayload } from "@chikkadb/interfaces/wire/types";
import { ObjectId } from "bson";
import os from 'os';

const processId = new ObjectId();

export function getHardcodedResponse(command: MQLCommand): OpMsgPayload {
  switch(command.command) {
    case 'buildInfo': {
      return {
        _type: 'OP_MSG',
        flagBits: 0,
        sections: [
          {
            sectionKind: 0,
            document: {
              version: '7.0.25',
              gitVersion: 'x',
              modules: [],
              versionArray: [7, 0, 25, 0],
              openssl: {
                running: 'OpenSSL 3.0.13 30 Jan 2024',
                compiled: 'OpenSSL 3.0.2 15 Mar 2022',
              },
              buildEnvironment: {},
              bits: 64,
              debug: false,
              maxBsonObjectSize: 16777216,
              storageEngines: ['devnull'],
              ok: 1,
            },
          },
        ],
      };
    }

    case 'getParameter': {
      return {
        _type: 'OP_MSG',
        flagBits: 0,
        sections: [
          {
            sectionKind: 0,
            document: {
              featureCompatibilityVersion: { version: '7.0' },
              ok: 1,
            },
          },
        ],
      };
    }

    case 'ping': {
      return {
        _type: 'OP_MSG',
        flagBits: 0,
        sections: [
          {
            sectionKind: 0,
            document: { ok: 1 },
          },
        ],
      };
    }

    case 'getLog': {
      return {
        _type: 'OP_MSG',
        flagBits: 0,
        sections: [
          {
            sectionKind: 0,
            document: {
              totalLinesWritten: 0,
              log: [],
              ok: 1,
            },
          },
        ],
      };
    }

    case 'hello': {
      return {
        _type: 'OP_MSG',
        flagBits: 0,
        sections: [
          {
            sectionKind: 0,
            document: {
              isWritablePrimary: true,
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
          },
        ],
      };
    }

    case 'ismaster': {
      return {
        _type: 'OP_MSG',
        flagBits: 0,
        sections: [
          {
            sectionKind: 0,
            document: {
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
              connectionId: 15,
              minWireVersion: 0,
              maxWireVersion: 21,
              readOnly: false,
              ok: 1,
            },
          },
        ],
      };
    };

    case 'listIndexes': {
      return {
        _type: 'OP_MSG',
        flagBits: 0,
        sections: [
          {
            sectionKind: 0,
            document: {
              cursor: {
                id: 0n,
                ns: `${command.database}.${command.collection}`,
                firstBatch: [],
              },
              ok: 1,
            },
          },
        ],
      };
    }

    case 'connectionStatus': {
      return {
        _type: 'OP_MSG',
        flagBits: 0,
        sections: [
          {
            sectionKind: 0,
            document: {
              authInfo: {
                authenticatedUsers: [],
                authenticatedUserRoles: [],
                authenticatedUserPrivileges: [],
              },
              ok: 1,
            },
          }
        ]
      }
    }

    case 'hostInfo': {
      return {
        _type: 'OP_MSG',
        flagBits: 0,
        sections: [
          {
            sectionKind: 0,
            document: {
              system: {
                currentTime: new Date(),
                hostname: os.hostname(),
                cpuAddrSize: 64,
                memSizeMB: 7668,
                memLimitMB: 7668,
                numCores: 8,
                numCoresAvailableToProcess: 8,
                numPhysicalCores: 4,
                numCpuSockets: 1,
                cpuArch: 'x86_64',
                numaEnabled: false,
                numNumaNodes: 1,
              },
              os: {},
              extra: {},
              ok: 1,
            }
          },
        ],
      };
    }

    default:
      throw new Error('No hardcoded response defined for command: ' + command.command);
  }
}